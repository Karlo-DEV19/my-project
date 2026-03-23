"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { XCircle } from "lucide-react"

export default function CheckoutFailedPage() {
  const router = useRouter()
  const params = useSearchParams()

  const trackingNumber  = params.get("tracking")
  const referenceNumber = params.get("reference")

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-border bg-background p-8 text-center space-y-6">

        <XCircle className="w-12 h-12 mx-auto text-rose-500" />

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Payment Cancelled</h1>
          <p className="text-sm text-muted-foreground">
            Your payment was not completed. No charges were made.
          </p>
        </div>

        {(trackingNumber || referenceNumber) && (
          <div className="border border-border bg-accent/5 p-4 text-left space-y-2">
            {trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                  Tracking #
                </span>
                <span className="text-xs font-medium text-foreground font-mono">
                  {trackingNumber}
                </span>
              </div>
            )}
            {referenceNumber && (
              <>
                <div className="h-px bg-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                    Reference #
                  </span>
                  <span className="text-xs font-medium text-foreground font-mono">
                    {referenceNumber}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          If you believe this is an error, please contact our support team
          with your reference number.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/shop/checkout")}
            className="w-full h-11 bg-foreground text-background text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/shop")}
            className="w-full h-11 border border-border bg-transparent text-foreground text-xs uppercase tracking-widest hover:bg-accent/10 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    </div>
  )
}