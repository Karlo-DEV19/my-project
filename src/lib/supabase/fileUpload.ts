import { createClient } from '@supabase/supabase-js';

// Environment variables for sensitive information
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


export const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_BYTES = 10 * 1024 * 1024;

// Configuration constants
const CONFIG = {
    STORAGE_BUCKET: 'images',
    DEFAULT_FOLDER: 'blinds',
    MAX_FILE_SIZE_MB: MAX_BYTES,
    ALLOWED_FILE_TYPES: ALLOWED_MIME,
    CACHE_CONTROL: '3600',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Initialize Supabase client with custom options
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    global: {
        headers: {
            'Cache-Control': 'no-cache',
        },
    },
});

// Add retry mechanism for operations
const retryOperation = async <T>(operation: () => Promise<T>, attempts = CONFIG.RETRY_ATTEMPTS): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (attempts <= 1) throw error;
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        return retryOperation(operation, attempts - 1);
    }
};

// Types (renamed to be more generic)
export interface FileUploadResponse {
    url: string | null;
    error: string | null;
    filePath: string | null;
}
export interface MultipleFileUploadResponse {
    successful: FileUploadResponse[];
    failed: FileUploadResponse[];
    allSuccessful: boolean;
}
export interface FileUploadOptions {
    file: File;
    customFileName?: string;
    maxSizeMB?: number;
    folder?: string;
}

/**
 * Validates a file based on type and size constraints.
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Error message or null if valid
 */
const validateFile = (file: File, maxSizeMB: number): string | null => {
    if (!file.type || !CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        return 'Please upload a valid file (JPG, PNG, or PDF)';
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `File size must be under ${maxSizeMB}MB`;
    }
    return null;
};

/**
 * Returns the file extension based on the MIME type.
 * @param mimeType - The file's MIME type
 * @returns The file extension including the dot
 */
const getFileExtension = (mimeType: string): string => {
    const extensions: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'application/pdf': '.pdf'
    };
    return extensions[mimeType] || '.unknown'; // Added PDF and fallback
};

/**
 * Generates a unique filename for upload
 * @param file - The file to be uploaded
 * @param customFileName - Optional custom filename
 * @returns A sanitized unique filename with extension
 */
const generateUniqueFileName = (file: File, customFileName?: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedFileName = (customFileName || file.name).replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50); // Optimized: sanitization, limit length
    const fileExtension = getFileExtension(file.type);
    return `${timestamp}-${randomString}-${sanitizedFileName}${fileExtension}`;
};

/**
 * Uploads a single file to Supabase Storage.
 * @param options - Upload options including file and preferences
 * @returns Promise with upload response
 */
export const uploadImage = async ({
    file,
    customFileName,
    maxSizeMB = CONFIG.MAX_FILE_SIZE_MB,
    folder = CONFIG.DEFAULT_FOLDER
}: FileUploadOptions): Promise<FileUploadResponse> => {
    try {
        // Validate the file
        const validationError = validateFile(file, maxSizeMB);
        if (validationError) {
            return {
                url: null,
                error: validationError,
                filePath: null
            };
        }

        // Generate filename and path
        const finalFileName = generateUniqueFileName(file, customFileName);
        const filePath = `${folder}/${finalFileName}`;

        // Upload to Supabase Storage with retry logic
        await retryOperation(async () => {
            const { error, data } = await supabase.storage
                .from(CONFIG.STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: CONFIG.CACHE_CONTROL,
                    contentType: file.type,
                    upsert: false
                });
            if (error) throw new Error(error.message);
            return data;
        });

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(CONFIG.STORAGE_BUCKET)
            .getPublicUrl(filePath);
        if (!publicUrl) {
            throw new Error('Failed to generate public URL for uploaded file');
        }

        return {
            url: publicUrl,
            error: null,
            filePath
        };
    } catch (error) {
        console.error('File upload failed:', error);
        let errorMessage = 'Failed to upload file';
        if (error instanceof Error) {
            if (error.message.includes('JWT')) {
                errorMessage = 'Authentication error. Please log in again.';
            } else if (error.message.includes('storage')) {
                errorMessage = 'Storage service error. Please try again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message;
            }
        }
        return {
            url: null,
            error: errorMessage,
            filePath: null
        };
    }
};

/**
 * Uploads multiple files to Supabase Storage.
 * @param files - Array of files to upload
 * @param options - Optional upload configuration
 * @returns Promise with results of all uploads
 */
export const uploadMultipleImages = async (
    files: File[],
    options: Omit<FileUploadOptions, 'file'> = {}
): Promise<MultipleFileUploadResponse> => {
    const uploadPromises = files.map(file => uploadImage({ file, ...options }));
    const results = await Promise.allSettled(uploadPromises); // Optimized: Use Promise.allSettled for better error handling
    const successful: FileUploadResponse[] = [];
    const failed: FileUploadResponse[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error) {
            successful.push(result.value);
        } else if (result.status === 'rejected') {
            failed.push({
                url: null,
                error: result.reason?.message || 'Upload failed',
                filePath: null
            });
        } else {
            // Fulfilled but with error
            const value = result.value;
            if (value.error) {
                failed.push(value);
            } else {
                successful.push(value);
            }
        }
    });

    return {
        successful,
        failed,
        allSuccessful: failed.length === 0
    };
};

/**
 * Get file download URL from a file path
 * @param filePath - The path of the file in storage
 * @returns Promise with the public URL or null
 */
export const getImageDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from(CONFIG.STORAGE_BUCKET)
            .getPublicUrl(filePath);
        return publicUrl || null;
    } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
    }
};

/**
 * Delete a file from storage
 * @param filePath - The path of the file to delete
 * @returns Promise resolving to success status
 */
export const deleteImage = async (filePath: string): Promise<boolean> => {
    try {
        const { error } = await supabase.storage
            .from(CONFIG.STORAGE_BUCKET)
            .remove([filePath]);
        return !error;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Batch delete multiple files from storage
 * @param filePaths - Array of file paths to delete
 * @returns Promise resolving to an array of deletion results
 */
export const deleteMultipleImages = async (filePaths: string[]): Promise<{
    successful: string[];
    failed: string[];
}> => {
    try {
        const { data, error } = await supabase.storage
            .from(CONFIG.STORAGE_BUCKET)
            .remove(filePaths);
        if (error) throw error;
        const successful = data?.map(item => item.name) || [];
        const failed = filePaths.filter(path => !successful.includes(path));
        return { successful, failed };
    } catch (error) {
        console.error('Error batch deleting files:', error);
        return {
            successful: [],
            failed: filePaths
        };
    }
};

/**
 * Helper function to handle file input change events for single file upload
 * @param file - File from input element
 * @returns Promise with upload result
 */
export const handleSingleImageUpload = async (file: File): Promise<FileUploadResponse> => {
    return uploadImage({ file });
};

/**
 * Helper function to handle file input change events for multiple file uploads
 * @param files - FileList or File[] from input element
 * @returns Promise with upload results
 */
export const handleMultipleImageUpload = async (
    files: FileList | File[]
): Promise<MultipleFileUploadResponse> => {
    const fileArray = Array.from(files);
    return uploadMultipleImages(fileArray);
};