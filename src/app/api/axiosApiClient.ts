// src/lib/axios/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiErrorMessage } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

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
 * This automatically extracts the error message from the backend response
 * so that we don't have to catch it manually in every hook.
 */
axiosApiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const message = getApiErrorMessage(error);
        // Throw a clean error with the backend message
        return Promise.reject(new Error(message));
    }
);

export type { AxiosRequestConfig, AxiosResponse };