'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Loader2, Package, ShoppingBag, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// ─── Auth helper (matches profile.tsx pattern) ────────────────────────────────

function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderSummary = {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  downpaymentAmount: string;
  balanceAmount: string;
  createdAt: string | Date;
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

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return '₱0.00';
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();

  const [orders,     setOrders]     = useState<OrderSummary[]>([]);
  const [authReady,  setAuthReady]  = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;

      if (!user?.email) {
        // Not authenticated — show sign-in prompt
        setAuthReady(true);
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setAuthReady(true);

      // Email sourced from the verified Supabase session — never from query params
      try {
        const res  = await fetch(`/api/v1/orders/my-orders?email=${encodeURIComponent(user.email)}`);
        const json = (await res.json()) as { success: boolean; data?: OrderSummary[]; message?: string };

        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        } else {
          setError(json.message ?? 'Could not load your orders. Please try again.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!authReady || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <User className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
        <p className="text-sm font-medium text-muted-foreground">You are not signed in.</p>
        <p className="text-xs text-muted-foreground/60">Please sign in to view your orders.</p>
        <Button
          id="orders-signin-btn"
          type="button"
          variant="outline"
          onClick={() => router.push('/')}
          className="mt-2 h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
        >
          Go to Home
        </Button>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button
              id="orders-retry-btn"
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2 h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Signed in ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* ── Heading card ── */}
        <div className="rounded-2xl border border-border bg-background shadow-sm px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Package className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">My Orders</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {orders.length === 0
                  ? 'No orders yet.'
                  : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-14 flex flex-col items-center gap-3 text-center">
            <Package className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.25} />
            <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
              Once you place an order, it will appear here so you can track its
              progress and payment status.
            </p>
            <Button
              id="orders-shop-btn"
              type="button"
              variant="outline"
              onClick={() => router.push('/shop')}
              className="mt-2 h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
            >
              Browse the Shop
            </Button>
          </div>
        )}

        {/* ── Order cards ── */}
        {orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const balance     = parseFloat(order.balanceAmount);
              const showBalance = !isNaN(balance) && balance > 0 && order.paymentStatus !== 'paid';

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden"
                >
                  {/* Top: tracking + date + status badges */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <ShoppingBag
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={1.75}
                          />
                          <p className="text-sm font-semibold text-foreground font-mono truncate">
                            {order.trackingNumber}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground pl-[22px]">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={order.status}        map={STATUS_COLORS} />
                        <StatusBadge status={order.paymentStatus} map={PAYMENT_STATUS_COLORS} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: financials + CTA */}
                  <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-4 flex-wrap bg-muted/20">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Total
                        </p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                      {showBalance && (
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Balance due
                          </p>
                          <p className="text-xs font-medium text-foreground/70 tabular-nums">
                            {formatCurrency(order.balanceAmount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <Link
                      id={`order-details-${order.id}`}
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-background text-xs font-semibold uppercase tracking-[0.15em] text-foreground hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
