// src/lib/axios/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiErrorMessage } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Structured API error — extends Error so existing catch(err).message code
 * still works, while also carrying the HTTP status and raw response data.
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Create a reusable Axios instance
 */
export const axiosApiClient: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
});

/**
 * Global Response Interceptor
 * Converts Axios errors into ApiError so callers can inspect status + data
 * while remaining fully backward-compatible with existing `err.message` usage.
 */
axiosApiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const message = getApiErrorMessage(error);
        const status  = error.response?.status ?? 0;
        const data    = error.response?.data;
        return Promise.reject(new ApiError(message, status, data));
    }
);

export type { AxiosRequestConfig, AxiosResponse };