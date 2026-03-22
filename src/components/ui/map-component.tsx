// components/ui/map-component.tsx
"use client"

// ─────────────────────────────────────────────────────────────
// DO NOT add `import "leaflet/dist/leaflet.css"` at the top level.
//
// Leaflet CSS must be injected *after* the client mounts and
// *before* the MapContainer renders. Top-level CSS imports in
// Next.js dynamic modules load asynchronously and can arrive
// after Leaflet initialises its pixel/coordinate math, causing
// click events to register at the wrong map position.
//
// We inject the stylesheet programmatically inside useEffect below.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import type {
    Map as LeafletMapType,
    Marker as LeafletMarker,
    LatLngExpression,
    LatLngBoundsExpression,
} from "leaflet"

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
export const PHILIPPINES_BOUNDS: LatLngBoundsExpression = [
    [4.5, 116.0],
    [21.5, 127.0],
]
export const DEFAULT_CENTER: LatLngExpression = [14.5995, 120.9842] // Manila

const isWithinPhilippines = (lat: number, lng: number) =>
    lat >= 4.5 && lat <= 21.5 && lng >= 116.0 && lng <= 127.0

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
export interface LeafletMapProps {
    marker: [number, number] | null
    onMapClick: (lat: number, lng: number) => void
    onMarkerDrag: (lat: number, lng: number) => void
    flyTo: [number, number] | null
}

// Modules loaded dynamically — typed for clarity
interface LeafletModules {
    MapContainer: any
    TileLayer: any
    Marker: any
    useMapEvents: any
    useMap: any
    brandIcon: any
}

// ─────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────
function MapLoading() {
    return (
        <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                    Loading map
                </p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Sub-components are defined OUTSIDE InnerMapComponent.
//
// If defined inside, React sees them as brand-new component types
// on every render of InnerMapComponent and unmounts/remounts them.
// This destroys the marker ref → dragend fires with stale position.
// ─────────────────────────────────────────────────────────────

function MapClickHandler({
    useMapEvents,
    onMapClick,
}: {
    useMapEvents: any
    onMapClick: (lat: number, lng: number) => void
}) {
    useMapEvents({
        click(e: any) {
            const { lat, lng } = e.latlng
            if (isWithinPhilippines(lat, lng)) {
                onMapClick(lat, lng)
            }
        },
    })
    return null
}

function MapNavigator({
    useMap,
    target,
    zoom,
}: {
    useMap: any
    target: LatLngExpression
    zoom: number
}) {
    const map: LeafletMapType = useMap()
    useEffect(() => {
        map.flyTo(target, zoom, { duration: 1.2, easeLinearity: 0.4 })
    }, [map, target, zoom])
    return null
}

function DraggableMarker({
    Marker,
    position,
    icon,
    onDragEnd,
}: {
    Marker: any
    position: LatLngExpression
    icon: any
    onDragEnd: (lat: number, lng: number) => void
}) {
    const markerRef = useRef<LeafletMarker | null>(null)

    // Stable event handler — only recreated if position or onDragEnd changes.
    // Using useMemo here (not useCallback) because Leaflet needs a plain object.
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const m = markerRef.current
                if (!m) return
                const { lat, lng } = m.getLatLng()
                if (isWithinPhilippines(lat, lng)) {
                    onDragEnd(lat, lng)
                } else {
                    // Snap back to last valid position when dragged outside PH
                    m.setLatLng(position)
                }
            },
        }),
        [position, onDragEnd]
    )

    return (
        <Marker
            draggable
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={icon}
        />
    )
}

// ─────────────────────────────────────────────────────────────
// Main map component — client-only
// ─────────────────────────────────────────────────────────────
function InnerMapComponent({ marker, onMapClick, onMarkerDrag, flyTo }: LeafletMapProps) {
    const [modules, setModules] = useState<LeafletModules | null>(null)

    useEffect(() => {
        // Import both libraries inside useEffect — they are never evaluated
        // during SSR. This also gives us a clean async boundary to inject CSS.
        Promise.all([
            import("react-leaflet"),
            import("leaflet"),
        ]).then(([rl, leafletModule]) => {
            const L = leafletModule.default

            // ── 1. Inject Leaflet CSS programmatically ───────────────
            // We insert a <link> tag instead of using a top-level import.
            // This ensures the stylesheet is present and applied before
            // the MapContainer renders, so Leaflet's pixel/lat-lng
            // coordinate mapping is correct from the very first render.
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link")
                link.id = "leaflet-css"
                link.rel = "stylesheet"
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                link.crossOrigin = ""
                document.head.appendChild(link)
            }

            // ── 2. Fix broken default marker icon paths ───────────────
            // Next.js / webpack strips the `_getIconUrl` method from the
            // default icon prototype. Without this fix the default marker
            // icons 404 and Leaflet falls back to a broken layout.
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })

            // ── 3. Create brand marker icon ONCE ─────────────────────
            // Creating the icon inside the render function means Leaflet
            // receives a new icon object reference on every state change
            // and re-applies it, causing the marker to visually "jump".
            // Created here once and stored in state.
            const brandIcon = L.divIcon({
                className: "",
                html: `
                    <div style="
                        position: relative;
                        width: 28px;
                        height: 36px;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
                    ">
                        <svg viewBox="0 0 28 36" fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style="width:100%;height:100%">
                            <path
                                d="M14 0C6.268 0 0 6.268 0 14
                                   C0 24.5 14 36 14 36
                                   C14 36 28 24.5 28 14
                                   C28 6.268 21.732 0 14 0Z"
                                fill="#1a1a1a"
                            />
                            <circle cx="14" cy="14" r="6" fill="white" opacity="0.95"/>
                            <circle cx="14" cy="14" r="3" fill="#1a1a1a"/>
                        </svg>
                    </div>
                `,
                iconSize: [28, 36],
                // [14, 36] = horizontal centre, bottom tip of the teardrop.
                // This pixel offset is what Leaflet places on the exact
                // clicked coordinate — getting this wrong shifts the visual
                // marker away from where you actually clicked.
                iconAnchor: [14, 36],
                popupAnchor: [0, -36],
            })

            setModules({
                MapContainer: rl.MapContainer,
                TileLayer: rl.TileLayer,
                Marker: rl.Marker,
                useMapEvents: rl.useMapEvents,
                useMap: rl.useMap,
                brandIcon,
            })
        }).catch((err) => {
            console.error("[Map] Failed to load Leaflet:", err)
        })
    }, []) // Runs once on mount — no dependencies needed

    if (!modules) return <MapLoading />

    const { MapContainer, TileLayer, Marker, useMapEvents, useMap, brandIcon } = modules

    return (
        <MapContainer
            center={marker ?? DEFAULT_CENTER}
            zoom={marker ? 17 : 6}
            className="w-full h-full"
            maxBounds={PHILIPPINES_BOUNDS}
            maxBoundsViscosity={0.9}
            minZoom={6}
            maxZoom={18}
            scrollWheelZoom
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Minimal attribution — required by OSM tile usage policy */}
            <div style={{
                position: "absolute",
                bottom: 6,
                right: 8,
                zIndex: 1000,
                fontSize: "9px",
                color: "#666",
                background: "rgba(255,255,255,0.75)",
                padding: "1px 5px",
                borderRadius: 2,
                pointerEvents: "none",
                userSelect: "none",
            }}>
                © OpenStreetMap
            </div>

            <MapClickHandler
                useMapEvents={useMapEvents}
                onMapClick={onMapClick}
            />

            {flyTo && (
                <MapNavigator
                    useMap={useMap}
                    target={flyTo}
                    zoom={17}
                />
            )}

            {marker && (
                <DraggableMarker
                    Marker={Marker}
                    position={marker}
                    icon={brandIcon}
                    onDragEnd={onMarkerDrag}
                />
            )}
        </MapContainer>
    )
}

// ─────────────────────────────────────────────────────────────
// Exported component — guaranteed client-only via dynamic()
// ─────────────────────────────────────────────────────────────
const LeafletMapComponent = dynamic(
    () => Promise.resolve(InnerMapComponent),
    { ssr: false, loading: MapLoading }
)

export default LeafletMapComponent