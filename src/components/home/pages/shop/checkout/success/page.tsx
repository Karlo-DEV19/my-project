
import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useGetOrderDetailsStatus } from "@/app/api/hooks/use-order"
function formatCurrency(value: string) {
  return `₱${parseFloat(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function CheckoutSuccess() {
  const router = useRouter()
  const params = useSearchParams()

  const trackingNumber = params.get("tracking")
  const referenceNumber = params.get("reference")

  const { isPending, isSuccess, isError, data } = useGetOrderDetailsStatus(
    referenceNumber ?? ""
  )

  const order = data?.data?.order
  const payment = data?.data?.payments?.[0]

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full border border-border bg-background p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Payment Successful</h1>
            <p className="text-sm text-muted-foreground">
              Thank you for your order! We'll process it right away.
            </p>
          </div>
        </div>

        {/* Tracking & Reference */}
        {(trackingNumber || referenceNumber) && (
          <div className="border border-border bg-accent/5 p-4 space-y-2">
            {trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                  Tracking #
                </span>
                <span className="text-xs font-medium font-mono">{trackingNumber}</span>
              </div>
            )}
            {referenceNumber && (
              <>
                {trackingNumber && <div className="h-px bg-border/50" />}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                    Reference #
                  </span>
                  <span className="text-xs font-medium font-mono">{referenceNumber}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading */}
        {isPending && referenceNumber && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading order details...</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-2 border border-destructive/30 bg-destructive/5 p-3 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs">Unable to load order details. Please check your email for confirmation.</span>
          </div>
        )}

        {/* Order Details */}
        {isSuccess && order && (
          <div className="space-y-4">

            {/* Order Status Row */}
            <div className="border border-border p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                Order Summary
              </p>

              <div className="space-y-2">
                <Row label="Status">
                  <StatusBadge value={order.status} type="order" />
                </Row>
                <Row label="Payment Status">
                  <StatusBadge value={order.paymentStatus} type="payment" />
                </Row>
                <Row label="Payment Method">
                  <span className="text-xs font-medium">{capitalize(order.paymentMethod)}</span>
                </Row>
                <Row label="Order Type">
                  <span className="text-xs font-medium">{capitalize(order.orderType)}</span>
                </Row>
                <Row label="Confirmed At">
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatDate(order.confirmedAt)}
                  </span>
                </Row>
              </div>
            </div>

            {/* Breakdown */}
            <div className="border border-border p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                Payment Breakdown
              </p>

              <div className="space-y-2">
                <Row label="Subtotal">
                  <span className="text-xs font-mono">{formatCurrency(order.subtotal)}</span>
                </Row>
                <Row label="VAT">
                  <span className="text-xs font-mono">{formatCurrency(order.vat)}</span>
                </Row>
                <Row label="Delivery Fee">
                  <span className="text-xs font-mono">
                    {parseFloat(order.deliveryFee) === 0 ? "Free" : formatCurrency(order.deliveryFee)}
                  </span>
                </Row>
                <div className="h-px bg-border/50" />
                <Row label="Total Amount">
                  <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                </Row>
              </div>
            </div>

            {/* Payment Details */}
            {payment && (
              <div className="border border-border p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                  Payment Details
                </p>

                <div className="space-y-2">
                  <Row label="Amount Paid">
                    <span className="text-xs font-mono">{formatCurrency(payment.amountPaid ?? "0")}</span>
                  </Row>
                  <Row label="Net Amount">
                    <span className="text-xs font-mono">{formatCurrency(payment.netAmount ?? "0")}</span>
                  </Row>
                  <Row label="Paid At">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDate(payment.paidAt)}
                    </span>
                  </Row>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
          You will receive a confirmation email shortly. Our team will contact you to coordinate delivery and installation.
        </p>

        {/* Back Button */}
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

// Helpers

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function StatusBadge({ value, type }: { value: string; type: "order" | "payment" }) {
  const isPositive =
    type === "order"
      ? ["confirmed", "delivered", "processing"].includes(value)
      : value === "paid"

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-sm ${isPositive
        ? "bg-emerald-500/10 text-emerald-600"
        : "bg-amber-500/10 text-amber-600"
        }`}
    >
      {value}
    </span>
  )
}