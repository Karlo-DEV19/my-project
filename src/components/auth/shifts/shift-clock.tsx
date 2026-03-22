"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
/* import { clockIn, clockOut, getActiveShift, getShiftHistory } from "@/lib/actions/shift-actions" */
import { useAuth } from "@/lib/providers/auth-provider"
import { LogIn, LogOut, Clock, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// ---- Types ------------------------------------------------
interface Shift {
    id: string
    shiftDate: string
    clockIn: Date
    clockOut?: Date | null
    assignmentType?: string | null
    status: string
    notes?: string | null
}

// ---- Helpers ----------------------------------------------
function formatTime(date: Date | string | null | undefined): string {
    if (!date) return "—"
    return new Date(date).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
    })
}

function getDuration(clockIn: Date | string, clockOut: Date | string | null | undefined): string {
    if (!clockOut) return "In progress"
    const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime()
    const totalMinutes = Math.floor(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes}m`
    return `${hours}h ${minutes}m`
}

// ---- Live Clock -------------------------------------------
function LiveClock() {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="text-center">
            <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
                {time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
        </div>
    )
}

// ---- Elapsed Timer (while clocked in) ---------------------
function ElapsedTimer({ since }: { since: Date | string }) {
    const [elapsed, setElapsed] = useState("")

    const compute = useCallback(() => {
        const ms = Date.now() - new Date(since).getTime()
        const totalSeconds = Math.floor(ms / 1000)
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        setElapsed(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        )
    }, [since])

    useEffect(() => {
        compute()
        const interval = setInterval(compute, 1000)
        return () => clearInterval(interval)
    }, [compute])

    return (
        <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Time Elapsed</p>
            <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{elapsed}</p>
        </div>
    )
}

// ---- Main Component ---------------------------------------
export default function ShiftClockWidget() {
    const { user } = useAuth()

    const [activeShift, setActiveShift] = useState<Shift | null>(null)
    const [history, setHistory] = useState<Shift[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [notes, setNotes] = useState("")
    const [assignmentType, setAssignmentType] = useState("")
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)

    // Initial data load
    /*     useEffect(() => {
            async function init() {
                setIsLoading(true)
                const [shiftRes, historyRes] = await Promise.all([
                    getActiveShift(),
                    getShiftHistory(7),
                ])
                if (shiftRes.success) setActiveShift(shiftRes.shift)
                if (historyRes.success) setHistory(historyRes.shifts)
                setIsLoading(false)
            }
            init()
        }, []) */

    function showFeedback(type: "success" | "error", message: string) {
        setFeedback({ type, message })
        setTimeout(() => setFeedback(null), 4000)
    }

    /*     function handleClockIn() {
            startTransition(async () => {
                const result = await clockIn(assignmentType || undefined)
                if (result.success && result.shift) {
                    setActiveShift(result.shift as Shift)
                    setAssignmentType("")
                    showFeedback("success", "You're clocked in. Have a great shift!")
                    // Refresh history
                    const historyRes = await getShiftHistory(7)
                    if (historyRes.success) setHistory(historyRes.shifts)
                } else {
                    showFeedback("error", result.error ?? "Clock-in failed.")
                }
            })
        }
     */
    /*     function handleClockOut() {
            startTransition(async () => {
                const result = await clockOut(notes || undefined)
                if (result.success) {
                    setActiveShift(null)
                    setNotes("")
                    showFeedback("success", "Clocked out successfully. See you next time!")
                    // Refresh history
                    const historyRes = await getShiftHistory(7)
                    if (historyRes.success) setHistory(historyRes.shifts)
                } else {
                    showFeedback("error", result.error ?? "Clock-out failed.")
                }
            })
        }
     */
    // Only show for employees
    /*     if (user?.table !== "employees") return null
     */
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {/* Main Card */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                {/* Status Bar */}
                <div
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest",
                        activeShift
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    <span
                        className={cn(
                            "w-2 h-2 rounded-full",
                            activeShift ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                        )}
                    />
                    {activeShift ? "Currently Clocked In" : "Not Clocked In"}
                </div>

                <div className="p-6 space-y-5">
                    {/* Live Clock */}
                    <LiveClock />

                    {/* Elapsed time while active */}
                    {activeShift && <ElapsedTimer since={activeShift.clockIn} />}

                    {/* Active shift info */}
                    {activeShift && (
                        <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Clock-in time</span>
                                <span className="font-medium">{formatTime(activeShift.clockIn)}</span>
                            </div>
                            {activeShift.assignmentType && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Assignment</span>
                                    <span className="font-medium">{activeShift.assignmentType}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <div
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                feedback.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "bg-destructive/10 text-destructive"
                            )}
                        >
                            {feedback.type === "success"
                                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                                : <AlertCircle className="w-4 h-4 shrink-0" />
                            }
                            {feedback.message}
                        </div>
                    )}

                    {/* Clock-in form */}
                    {!activeShift && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Assignment type (optional)"
                                value={assignmentType}
                                onChange={(e) => setAssignmentType(e.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {/*                <button
                                onClick={handleClockIn}
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                Clock In
                            </button> */}
                        </div>
                    )}

                    {/* Clock-out form */}
                    {activeShift && (
                        <div className="space-y-3">
                            <textarea
                                placeholder="End-of-shift notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            {/*          <button
                                onClick={handleClockOut}
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-4 py-3 text-sm font-semibold transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                Clock Out
                            </button> */}
                        </div>
                    )}
                </div>
            </div>

            {/* Shift History */}
            {history.length > 0 && (
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowHistory((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            Recent Shifts
                        </span>
                        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showHistory && (
                        <div className="divide-y">
                            {history.map((shift) => (
                                <div key={shift.id} className="px-4 py-3 text-sm space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{formatDate(shift.shiftDate)}</span>
                                        <span
                                            className={cn(
                                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                                shift.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {shift.status === "active" ? "In Progress" : "Completed"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{formatTime(shift.clockIn)} → {formatTime(shift.clockOut)}</span>
                                        <span>{getDuration(shift.clockIn, shift.clockOut)}</span>
                                    </div>
                                    {shift.assignmentType && (
                                        <p className="text-xs text-muted-foreground">{shift.assignmentType}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}