"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const params = useSearchParams()

  const trackingNumber  = params.get("tracking")
  const referenceNumber = params.get("reference")

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-border bg-background p-8 text-center space-y-6">

        <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Payment Successful</h1>
          <p className="text-sm text-muted-foreground">
            Thank you for your order! We'll process it right away.
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
          You will receive a confirmation email shortly. Our team will
          contact you to coordinate delivery and installation.
        </p>

        <button
          onClick={() => router.push("/shop")}
          className="w-full h-11 bg-foreground text-background text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Back to Shop
        </button>
      </div>
    </div>
  )
}