// components/ui/location-picker.tsx
"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    MapPin,
    Search,
    Loader2,
    LocateFixed,
    X,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"
import {
    useReverseGeocodeMutation,
    useSearchLocationMutation,
    LocationData,
    AddressComponents,
} from "@/app/api/hooks/useGeocode"

export type { LocationData, AddressComponents }

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const PH_BOUNDS = { south: 4.5, north: 21.5, west: 116.0, east: 127.0 } as const
const PH_CENTER: [number, number] = [12.8797, 121.774]

const isWithinPH = (lat: number, lng: number) =>
    lat >= PH_BOUNDS.south &&
    lat <= PH_BOUNDS.north &&
    lng >= PH_BOUNDS.west &&
    lng <= PH_BOUNDS.east

// ─────────────────────────────────────────────────────────────
// Map skeleton
// ─────────────────────────────────────────────────────────────
function MapSkeleton() {
    return (
        <div className="w-full h-[280px] sm:h-80 border border-border/50 bg-muted/20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs tracking-widest uppercase">Loading map</p>
            </div>
        </div>
    )
}

// Lazy-load Leaflet — never runs on the server
const LeafletMap = dynamic(() => import("@/components/ui/map-component"), {
    ssr: false,
    loading: () => <MapSkeleton />,
})

// ─────────────────────────────────────────────────────────────
// Status banner
// ─────────────────────────────────────────────────────────────
type StatusType = "error" | "success" | "warning"

function StatusBanner({
    type,
    message,
    onDismiss,
}: {
    type: StatusType
    message: string
    onDismiss: () => void
}) {
    const styles: Record<StatusType, string> = {
        error: "bg-destructive/10 border-destructive/20 text-destructive",
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
    }

    const icons: Record<StatusType, React.ReactNode> = {
        error: <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
        success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
        warning: <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    }

    return (
        <div
            className={`flex items-start gap-2 px-3 py-2.5 border text-xs animate-in fade-in duration-200 ${styles[type]}`}
        >
            {icons[type]}
            <p className="flex-1 leading-relaxed">{message}</p>
            <button
                onClick={onDismiss}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// LocationPicker
// ─────────────────────────────────────────────────────────────
interface LocationPickerProps {
    onLocationSelect: (location: LocationData) => void
    initialLocation?: { lat: number; lng: number }
    className?: string
}

export default function LocationPicker({
    onLocationSelect,
    initialLocation,
    className = "",
}: LocationPickerProps) {
    const [marker, setMarker] = useState<[number, number] | null>(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : null
    )
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
    const [address, setAddress] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    type StatusState =
        | { type: StatusType; message: string }
        | null
    const [status, setStatus] = useState<StatusState>(null)

    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [permissionDenied, setPermissionDenied] = useState(false)
    const [geolocationSupported, setGeolocationSupported] = useState(true)

    const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const reverseGeocode = useReverseGeocodeMutation()
    const searchLocation = useSearchLocationMutation()

    const isLoading = reverseGeocode.isPending || searchLocation.isPending || isGettingLocation
    console.log("address", address)
    // ── Auto-dismiss status after 5s ──────────────────────────
    useEffect(() => {
        if (!status) return
        if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current)
        dismissTimeoutRef.current = setTimeout(() => setStatus(null), 5000)
        return () => { if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current) }
    }, [status])

    // ── Check geolocation support ─────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return
        const supported = !!navigator.geolocation && window.isSecureContext
        setGeolocationSupported(supported)

        if (supported && navigator.permissions) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((perm) => {
                    setPermissionDenied(perm.state === "denied")
                    perm.onchange = () => setPermissionDenied(perm.state === "denied")
                })
                .catch(() => { })
        }
    }, [])

    // ── Handle map click / marker drag ───────────────────────
    const handleLocationUpdate = useCallback(
        (lat: number, lng: number) => {
            if (!isWithinPH(lat, lng)) {
                setStatus({ type: "error", message: "Location must be within the Philippines." })
                return
            }

            setMarker([lat, lng])
            setStatus(null)

            reverseGeocode.mutate(
                { lat, lon: lng },
                {
                    onSuccess: (data) => {
                        console.log("data", data.address)
                        setAddress(data.address)
                        onLocationSelect(data)
                        setStatus({ type: "success", message: "Location pinned successfully." })
                    },
                    onError: () => {
                        const fallback: LocationData = {
                            lat,
                            lng,
                            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        }
                        setAddress(fallback.address)
                        onLocationSelect(fallback)
                        setStatus({ type: "warning", message: "Could not resolve address — using coordinates." })
                    },
                }
            )
        },
        [reverseGeocode, onLocationSelect]
    )

    // ── Search ────────────────────────────────────────────────
    const handleSearch = useCallback(() => {
        const q = searchQuery.trim()
        if (!q) {
            setStatus({ type: "error", message: "Please enter a search term." })
            return
        }

        setStatus(null)

        searchLocation.mutate(q, {
            onSuccess: (data) => {
                if (!data) {
                    setStatus({ type: "error", message: "No results found. Try a different search." })
                    return
                }
                if (!isWithinPH(data.lat, data.lng)) {
                    setStatus({ type: "error", message: "That location is outside the Philippines." })
                    return
                }
                setMarker([data.lat, data.lng])
                setFlyTo([data.lat, data.lng])
                setAddress(data.address)
                onLocationSelect(data)
                setStatus({ type: "success", message: "Location found." })
            },
            onError: () => {
                setStatus({ type: "error", message: "Search failed. Please try again." })
            },
        })
    }, [searchQuery, searchLocation, onLocationSelect])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
            }
        },
        [handleSearch]
    )

    // ── Geolocation ───────────────────────────────────────────
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation || !window.isSecureContext) {
            setStatus({ type: "error", message: "Geolocation requires a secure connection (HTTPS)." })
            return
        }

        setIsGettingLocation(true)
        setStatus(null)

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords

                if (!isWithinPH(lat, lng)) {
                    setStatus({ type: "error", message: "Your location is outside the Philippines." })
                    setIsGettingLocation(false)
                    return
                }

                setMarker([lat, lng])
                setFlyTo([lat, lng])

                reverseGeocode.mutate(
                    { lat, lon: lng },
                    {
                        onSuccess: (data) => {
                            setAddress(data.address)
                            onLocationSelect(data)
                            setStatus({
                                type: "success",
                                message: `Location detected. (±${Math.round(accuracy)}m accuracy)`,
                            })
                        },
                        onError: () => {
                            const fallback: LocationData = { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
                            setAddress(fallback.address)
                            onLocationSelect(fallback)
                            setStatus({ type: "success", message: "Location detected using coordinates." })
                        },
                        onSettled: () => setIsGettingLocation(false),
                    }
                )
            },
            (err) => {
                setIsGettingLocation(false)
                const messages: Record<number, string> = {
                    1: "Location permission denied. Please enable it in your browser settings.",
                    2: "Location unavailable. Please check your device settings.",
                    3: "Location request timed out. Please try again.",
                }
                setStatus({ type: "error", message: messages[err.code] ?? "Could not get your location." })
                if (err.code === 1) setPermissionDenied(true)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    }, [reverseGeocode, onLocationSelect])

    // ── Clear ─────────────────────────────────────────────────
    const handleClear = useCallback(() => {
        setMarker(null)
        setFlyTo(PH_CENTER)
        setAddress("")
        setSearchQuery("")
        setStatus(null)
    }, [])

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Header label */}
            <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                    Pin Your Location
                </span>
            </div>

            {/* Status */}
            {status && (
                <StatusBanner
                    type={status.type}
                    message={status.message}
                    onDismiss={() => setStatus(null)}
                />
            )}

            {/* Permission denied warning */}
            {permissionDenied && !status && (
                <div className="flex items-start gap-2 px-3 py-2.5 border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Location access blocked</p>
                        <p className="opacity-80 mt-0.5">
                            Enable location permissions in your browser settings to use this feature.
                        </p>
                    </div>
                </div>
            )}

            {/* Search + controls */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search address, landmark, or area..."
                        className="pl-9 h-10 bg-transparent text-sm rounded-none border-border/70"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSearch}
                        disabled={isLoading || !searchQuery.trim()}
                        className="h-10 px-4 text-xs rounded-none flex-1 sm:flex-none"
                    >
                        {searchLocation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Search className="w-3.5 h-3.5" />
                        )}
                        <span className="ml-1.5">Search</span>
                    </Button>

                    {geolocationSupported && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleGetCurrentLocation}
                            disabled={isLoading || permissionDenied}
                            title={permissionDenied ? "Location permission denied" : "Use my current location"}
                            className="h-10 w-10 rounded-none border-border/70 shrink-0"
                        >
                            {isGettingLocation ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <LocateFixed className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    )}

                    {marker && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleClear}
                            disabled={isLoading}
                            title="Clear selection"
                            className="h-10 w-10 rounded-none border-border/70 shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="relative w-full h-[280px] sm:h-80 border border-border/50 overflow-hidden z-0">
                <LeafletMap
                    marker={marker}
                    onMapClick={handleLocationUpdate}
                    onMarkerDrag={handleLocationUpdate}
                    flyTo={flyTo}
                />

                {isLoading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-1000">
                        <div className="flex items-center gap-2.5 bg-background border border-border px-4 py-2 shadow-lg">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-xs tracking-wide">Locating...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Selected location info */}
            {marker ? (
                <div className="flex items-start gap-3 p-3.5 border border-border/50 bg-accent/5">
                    <div className="p-1.5 bg-foreground/5 shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                            Pinned Location
                        </p>
                        <p className="text-xs font-medium text-foreground wrap-break-word leading-relaxed">
                            {address || (
                                <span className="text-muted-foreground italic">Resolving address...</span>
                            )}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 space-x-3">
                            <span>Lat: {marker[0].toFixed(6)}</span>
                            <span>Lng: {marker[1].toFixed(6)}</span>
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3.5 border border-dashed border-border/50">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        Click the map, search for an address, or use your current location.
                    </p>
                </div>
            )}
        </div>
    )
}