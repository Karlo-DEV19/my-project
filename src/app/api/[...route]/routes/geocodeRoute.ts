// src/app/api/[...route]/controllers/geocode-controller.ts

import { Hono } from "hono"

const geocodeRoute = new Hono()

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
const USER_AGENT = "EmxVibe/1.0 (contact@emxvibe.com)"

// Simple rate limiting
const requestCache = new Map<string, number>()
const RATE_LIMIT_MS = 1100

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const lastRequest = requestCache.get(ip)

    if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
        return true
    }

    requestCache.set(ip, now)

    // Clean old entries periodically
    if (requestCache.size > 100) {
        const cutoff = now - 60000
        for (const [key, time] of requestCache.entries()) {
            if (time < cutoff) requestCache.delete(key)
        }
    }

    return false
}

/**
 * Geocode API - Forward and Reverse Geocoding
 * GET /api/geocode?lat=14.5995&lon=120.9842 (reverse geocode)
 * GET /api/geocode?q=Manila (forward geocode)
 */
geocodeRoute.get("/", async (c) => {
    try {
        const lat = c.req.query("lat")
        const lon = c.req.query("lon")
        const q = c.req.query("q")

        // Rate limiting
        const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        if (isRateLimited(ip)) {
            return c.json(
                { success: false, message: "Rate limited. Please wait a moment.", data: null },
                429
            )
        }

        let nominatimUrl: string

        if (q) {
            // Forward geocoding (address to coordinates)
            nominatimUrl = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ph&limit=5&addressdetails=1`
        } else if (lat && lon) {
            // Reverse geocoding (coordinates to address)
            nominatimUrl = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
        } else {
            return c.json(
                {
                    success: false,
                    message: "Missing parameters. Provide 'q' for search or 'lat' and 'lon' for reverse geocoding.",
                    data: null,
                },
                400
            )
        }

        const response = await fetch(nominatimUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                "Accept-Language": "en",
                "Accept": "application/json",
            },
        })

        if (!response.ok) {
            console.error(`Nominatim error: ${response.status}`)
            return c.json(
                { success: false, message: "Geocoding service unavailable", data: null },
                502
            )
        }

        const data = await response.json()

        // Set cache header
        c.header("Cache-Control", "public, max-age=3600")

        return c.json(data, 200)
    } catch (error) {
        console.error("Geocode error:", error)
        return c.json(
            { success: false, message: "Internal server error", data: null },
            500
        )
    }
})

export default geocodeRoute