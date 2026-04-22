'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredUser = { id: string; name?: string; email?: string };

type OrderDetail = {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  orderType: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryFormattedAddress: string | null;
  deliveryNotes: string | null;
  subtotal: string;
  vat: string;
  deliveryFee: string;
  totalAmount: string;
  downpaymentAmount: string;
  downpaymentStatus: string;
  balanceAmount: string;
  createdAt: string | Date;
  confirmedAt: string | Date | null;
};

type OrderItem = {
  id: string;
  productName: string;
  productCode: string;
  colorName: string | null;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-300/50',
  confirmed:        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300/50',
  processing:       'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300/50',
  ready:            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-300/50',
  out_for_delivery: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300/50',
  delivered:        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-300/50',
  completed:        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-300/50',
  cancelled:        'bg-destructive/10 text-destructive border-destructive/30',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid:   'bg-yellow-500/10 text-yellow-600 border-yellow-300/50',
  downpaid: 'bg-blue-500/10 text-blue-600 border-blue-300/50',
  paid:     'bg-green-500/10 text-green-600 border-green-300/50',
  failed:   'bg-destructive/10 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-border',
};

function formatDate(d: string | Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(v: string | number): string {
  return `₱${parseFloat(String(v)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        map[status] ?? 'bg-muted text-muted-foreground border-border',
      ].join(' ')}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <p className={['text-xs font-medium text-foreground text-right', mono ? 'font-mono' : ''].join(' ')}>
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const router   = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  const [order,     setOrder]     = useState<OrderDetail | null>(null);
  const [items,     setItems]     = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let userEmail = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) userEmail = (JSON.parse(stored) as StoredUser).email ?? '';
    } catch { /* ignore */ }

    if (!userEmail) {
      router.replace('/');
      return;
    }

    fetch(`/api/v1/orders/${orderId}?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setOrder(json.data.order);
          setItems(json.data.items ?? []);
        } else {
          // 403 → user trying to view someone else's order
          setError(json.message === 'Unauthorized'
            ? 'You do not have permission to view this order.'
            : (json.message ?? 'Order not found.'));
        }
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [orderId, router]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-6">
          <button
            onClick={() => router.replace('/profile?tab=orders')}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to Orders
          </button>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 flex flex-col items-center gap-3 text-center">
            <X className="h-8 w-8 text-destructive/60" />
            <p className="text-sm font-semibold text-destructive">{error ?? 'Order not found.'}</p>
            <Button
              variant="outline"
              onClick={() => router.replace('/profile?tab=orders')}
              className="mt-2 h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
            >
              Go to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const customerName = `${order.customerFirstName} ${order.customerLastName}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">

        {/* ── Back ── */}
        <button
          onClick={() => router.replace('/profile?tab=orders')}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to Orders
        </button>

        {/* ── Header card ── */}
        <div className="rounded-2xl border border-border bg-background shadow-sm px-6 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <h1 className="text-lg font-semibold text-foreground font-mono">
                  {order.trackingNumber}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={order.status} map={STATUS_COLORS} />
              <StatusBadge status={order.paymentStatus} map={PAYMENT_STATUS_COLORS} />
            </div>
          </div>
        </div>

        {/* ── Progress steps ── */}
        {order.status !== 'cancelled' && (
          <div className="rounded-2xl border border-border bg-background shadow-sm px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Order Progress
            </p>
            {(() => {
              const STEPS = [
                { key: 'pending',          label: 'Order Placed',    icon: <Check className="h-3 w-3" /> },
                { key: 'confirmed',        label: 'Confirmed',       icon: <Check className="h-3 w-3" /> },
                { key: 'processing',       label: 'Processing',      icon: <Package className="h-3 w-3" /> },
                { key: 'ready',            label: 'Ready',           icon: <Clock className="h-3 w-3" /> },
                { key: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck className="h-3 w-3" /> },
                { key: 'delivered',        label: 'Delivered',       icon: <Check className="h-3 w-3" /> },
              ];
              const currentIdx = STEPS.findIndex((s) => s.key === order.status);
              return (
                <div className="flex items-center gap-0">
                  {STEPS.map((step, idx) => {
                    const done    = idx < currentIdx;
                    const current = idx === currentIdx;
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className={[
                            'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition-colors',
                            done    ? 'bg-foreground border-foreground text-background' :
                            current ? 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/20' :
                                      'bg-muted border-border text-muted-foreground',
                          ].join(' ')}>
                            {step.icon}
                          </div>
                          <p className={[
                            'text-[9px] font-medium uppercase tracking-wider text-center w-14',
                            current ? 'text-foreground' : done ? 'text-foreground/70' : 'text-muted-foreground',
                          ].join(' ')}>
                            {step.label}
                          </p>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={[
                            'h-px flex-1 mb-4 mx-1 transition-colors',
                            done ? 'bg-foreground' : 'bg-border',
                          ].join(' ')} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* ── Order Info ── */}
          <Section title="Order Info">
            <Row label="Tracking #"   value={order.trackingNumber}                mono />
            <Row label="Reference #"  value={order.referenceNumber}               mono />
            <Row label="Date Placed"  value={formatDate(order.createdAt)}              />
            <Row label="Order Type"   value={order.orderType.replace(/_/g, ' ')}       />
            <Row label="Payment"      value={order.paymentMethod.toUpperCase()}    mono />
          </Section>

          {/* ── Customer Info ── */}
          <Section title="Customer">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.75} />
                <p className="text-xs font-medium text-foreground">{customerName}</p>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.75} />
                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              </div>
              {order.deliveryFormattedAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.75} />
                  <p className="text-xs text-muted-foreground leading-relaxed">{order.deliveryFormattedAddress}</p>
                </div>
              )}
              {order.deliveryNotes && (
                <p className="text-xs text-muted-foreground/70 italic border-t border-border/50 pt-2 mt-2">
                  Note: {order.deliveryNotes}
                </p>
              )}
            </div>
          </Section>

        </div>

        {/* ── Order Items ── */}
        <Section title={`Items (${items.length})`}>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No items found.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{item.productName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{item.productCode}</p>
                    {item.colorName && (
                      <p className="text-[10px] text-muted-foreground">Color: {item.colorName}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* ── Financials ── */}
        <Section title="Payment Summary">
          <Row label="Subtotal"         value={formatCurrency(order.subtotal)}          />
          <Row label="VAT (12%)"        value={formatCurrency(order.vat)}               />
          <Row label="Delivery Fee"     value={formatCurrency(order.deliveryFee)}       />
          <div className="border-t border-border mt-2 pt-2">
            <Row label="Total Amount"   value={<span className="font-semibold">{formatCurrency(order.totalAmount)}</span>} />
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <p className="text-xs text-muted-foreground">Downpayment (50%)</p>
                <StatusBadge status={order.downpaymentStatus} map={PAYMENT_STATUS_COLORS} />
              </div>
              <p className="text-xs font-semibold tabular-nums text-foreground">
                {formatCurrency(order.downpaymentAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground pl-5">Remaining Balance</p>
              <p className="text-xs font-semibold tabular-nums text-foreground">
                {formatCurrency(order.balanceAmount)}
              </p>
            </div>
          </div>
        </Section>

        {/* ── Action ── */}
        <Button
          variant="outline"
          onClick={() => router.replace('/profile?tab=orders')}
          className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
          Back to My Orders
        </Button>

      </div>
    </div>
  );
}
