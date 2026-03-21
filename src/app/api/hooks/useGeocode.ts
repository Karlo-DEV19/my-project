// src/app/api/hooks/useGeocode.ts

import { useMutation, useQuery } from "@tanstack/react-query"
import { axiosApiClient } from "../axiosApiClient"

// Types
export interface AddressComponents {
    building?: string
    street?: string
    block?: string
    barangay?: string
    city?: string
    province?: string
    region?: string
    zip?: string
}

export interface GeocodeResult {
    lat: string
    lon: string
    display_name: string
    address?: Record<string, string>
}

export interface LocationData {
    lat: number
    lng: number
    address: string
    components?: AddressComponents
}

// Query keys
export const geocodeKeys = {
    all: ["geocode"] as const,
    reverse: (lat: number, lon: number) => [...geocodeKeys.all, "reverse", lat, lon] as const,
    search: (query: string) => [...geocodeKeys.all, "search", query] as const,
}

// Helper to extract address components
const extractAddressComponents = (addr: Record<string, string> = {}): AddressComponents => ({
    building: addr.house_number || addr.building || "",
    street: addr.road || addr.street || addr.pedestrian || "",
    block: addr.subdivision || addr.neighbourhood || "",
    barangay: addr.quarter || addr.neighbourhood || addr.suburb || addr.village || "",
    city: addr.city || addr.municipality || addr.town || addr.city_district || "",
    province: addr.province || addr.county || "",
    region: addr.state || addr.region || "",
    zip: addr.postcode || "",
})

// API functions
const geocodeApi = {
    // Reverse geocode (coordinates to address)
    reverse: async (lat: number, lon: number): Promise<LocationData> => {
        const response = await axiosApiClient.get<GeocodeResult>("/geocode", {
            params: { lat, lon },
        })

        const data = response.data

        return {
            lat,
            lng: lon,
            address: data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            components: extractAddressComponents(data.address || {}),
        }
    },

    // Forward geocode (address to coordinates)
    search: async (query: string): Promise<LocationData | null> => {
        const response = await axiosApiClient.get<GeocodeResult[]>("/geocode", {
            params: { q: `${query}, Philippines` },
        })

        const results = Array.isArray(response.data) ? response.data : [response.data]
        const result = results[0]

        if (!result?.lat || !result?.lon) {
            return null
        }

        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name || "",
            components: extractAddressComponents(result.address || {}),
        }
    },
}

/**
 * Hook for reverse geocoding (coordinates to address)
 * Use when you have coordinates and need the address
 */
export const useReverseGeocode = (lat?: number, lon?: number) => {
    return useQuery({
        queryKey: geocodeKeys.reverse(lat || 0, lon || 0),
        queryFn: () => geocodeApi.reverse(lat!, lon!),
        enabled: !!lat && !!lon,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
        refetchOnWindowFocus: false,
        retry: 2,
    })
}

/**
 * Hook for forward geocoding (search address)
 * Use when searching for an address
 */
export const useSearchLocation = (query: string, enabled = true) => {
    return useQuery({
        queryKey: geocodeKeys.search(query),
        queryFn: () => geocodeApi.search(query),
        enabled: enabled && query.length >= 3,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour cache
        refetchOnWindowFocus: false,
        retry: 1,
    })
}

/**
 * Mutation hook for reverse geocoding
 * Use when you need to geocode on demand (e.g., on map click)
 */
export const useReverseGeocodeMutation = () => {
    return useMutation({
        mutationFn: ({ lat, lon }: { lat: number; lon: number }) =>
            geocodeApi.reverse(lat, lon),
    })
}

/**
 * Mutation hook for forward geocoding
 * Use when you need to search on demand (e.g., on button click)
 */
export const useSearchLocationMutation = () => {
    return useMutation({
        mutationFn: (query: string) => geocodeApi.search(query),
    })
}