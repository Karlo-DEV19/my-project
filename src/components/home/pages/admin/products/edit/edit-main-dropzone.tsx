'use client';

import { memo, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Upload, Plus, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

// Derive a displayable preview URL from File | string
function toPreviewUrl(item: File | string): string {
    return item instanceof File ? URL.createObjectURL(item) : item;
}

interface EditMainDropZoneProps {
    // Each item is either a new File or an existing URL string
    files: (File | string)[];
    onChange: (files: (File | string)[]) => void;
    error?: string;
}

export const EditMainDropZone = memo(({ files, onChange, error }: EditMainDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const [addMode, setAddMode] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(
        (list: FileList | null) => {
            if (!list) return;
            const valid = Array.from(list).filter(
                (f) => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES
            );
            onChange([...files, ...valid].slice(0, 6));
        },
        [files, onChange]
    );

    const commitUrl = useCallback(() => {
        const trimmed = urlInput.trim();
        if (!trimmed || files.length >= 6) return;
        try {
            new URL(trimmed);
            onChange([...files, trimmed].slice(0, 6));
            setUrlInput('');
        } catch {
            // invalid URL — silently ignore; zod will surface it
        }
    }, [urlInput, files, onChange]);

    const removeAt = useCallback(
        (idx: number) => onChange(files.filter((_, i) => i !== idx)),
        [files, onChange]
    );

    const coverPreview = files[0] ? toPreviewUrl(files[0]) : null;
    const extraPreviews = files.slice(1).map(toPreviewUrl);

    return (
        <div className="flex flex-col gap-3">
            {/* Cover drop area */}
            <div
                onClick={() => addMode === 'upload' && inputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={cn(
                    'relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                    addMode === 'upload' && 'cursor-pointer',
                    dragging
                        ? 'border-primary bg-primary/5'
                        : coverPreview
                        ? 'border-transparent'
                        : error
                        ? 'border-destructive/50'
                        : 'border-border bg-muted/30 hover:border-primary/50'
                )}
            >
                {coverPreview ? (
                    <>
                        <Image
                            src={coverPreview}
                            alt="Cover"
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="50vw"
                        />
                        <Badge className="absolute left-2 top-2 text-[10px]">Cover</Badge>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAt(0); }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div
                            className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-full border',
                                dragging
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-muted-foreground'
                            )}
                        >
                            <Upload className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                {dragging ? 'Drop to upload' : 'Upload cover image'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                JPG, PNG, WEBP · Max 10 MB
                            </p>
                        </div>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                />
            </div>

            {/* Add more: mode toggle + URL input */}
            {files.length < 6 && (
                <div className="space-y-2">
                    <div className="flex gap-1 p-0.5 bg-muted rounded-md w-fit">
                        {(['upload', 'url'] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setAddMode(m)}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                                    addMode === m
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {m === 'upload' ? (
                                    <Upload className="h-3 w-3" />
                                ) : (
                                    <Link className="h-3 w-3" />
                                )}
                                {m === 'upload' ? 'Upload File' : 'Paste URL'}
                            </button>
                        ))}
                    </div>

                    {addMode === 'url' && (
                        <div className="flex gap-2">
                            <Input
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && (e.preventDefault(), commitUrl())
                                }
                                placeholder="https://example.com/image.jpg"
                                className="text-sm h-9"
                            />
                            <button
                                type="button"
                                onClick={commitUrl}
                                disabled={!urlInput.trim() || files.length >= 6}
                                className="shrink-0 h-9 px-3 rounded-md text-sm bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Extra thumbnails */}
            {files.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {extraPreviews.map((src, i) => (
                        <div
                            key={i}
                            className="group relative aspect-square w-16 overflow-hidden rounded-lg border bg-muted"
                        >
                            <Image
                                src={src}
                                alt={`img-${i + 2}`}
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="64px"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                                <button
                                    type="button"
                                    onClick={() => removeAt(i + 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 group-hover:opacity-100"
                                >
                                    <X className="h-3 w-3 text-gray-800" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {files.length < 6 && addMode === 'upload' && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex aspect-square w-16 items-center justify-center rounded-lg border border-dashed hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                    <span className="self-center text-[11px] text-muted-foreground">
                        {files.length} / 6
                    </span>
                </div>
            )}

            {error && (
                <p className="text-[12px] font-medium text-destructive">{error}</p>
            )}
        </div>
    );
});

EditMainDropZone.displayName = 'EditMainDropZone';