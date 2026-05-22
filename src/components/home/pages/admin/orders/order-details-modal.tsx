'use client';

import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getDeliveryFee } from '@/lib/utils/delivery-fee';
import {
    User,
    CreditCard,
    Hash,
    MapPin,
    Receipt,
    Loader2,
    AlertCircle,
    ShoppingCart,
    Printer,
    Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminOrderItem = {
    id: string;
    productName: string;
    productCode: string | null;
    colorName: string | null;
    quantity: number;
    unitPrice: string;           // effective (promo) unit price at order time
    regularUnitPrice: string | null;  // original price; null for non-promo / legacy rows
    subtotal: string;
    discountType: string | null;
    discountValue: number | null;
};

/** Returns a short discount label, e.g. "50% OFF" or "₱45 OFF" */
function promoLabel(discountType: string, discountValue: number): string {
    return discountType === 'percentage'
        ? `${discountValue}% OFF`
        : `₱${discountValue.toLocaleString()} OFF`;
}

type AdminPayment = {
    id: string;
    paymentType: string;
    status: string;
    paymentMethod: string | null;
    amountDue: string | null;
    amountPaid: string | null;
    paidAt: string | Date | null;
    createdAt: string | Date | null;
};

type AdminOrderDetail = {
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
    customerPhoneSecondary: string | null;

    deliveryUnitFloor: string | null;
    deliveryStreet: string | null;
    deliveryBarangay: string | null;
    deliveryCity: string | null;
    deliveryProvince: string | null;
    deliveryZipCode: string | null;
    deliveryFormattedAddress: string | null;
    deliveryNotes: string | null;

    subtotal: string | null;
    vat: string | null;
    deliveryFee: string | null;
    totalAmount: string;
    downpaymentAmount: string;
    downpaymentStatus: string | null;
    downpaymentPaidAt: string | Date | null;
    balanceAmount: string;
    balancePaidAt: string | Date | null;

    confirmedAt: string | Date | null;
    cancelledAt: string | Date | null;
    cancellationReason: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
};

type AdminOrderResponse = {
    success: boolean;
    data: {
        order: AdminOrderDetail;
        items: AdminOrderItem[];
        payments: AdminPayment[];
    };
};

/** Minimal shape passed from the orders table row — used only to open the modal */
type OrderSummary = {
    id: string;
    trackingNumber: string;
    status: string;
    paymentStatus: string;
};

interface OrderDetailsModalProps {
    order: OrderSummary | null;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number | string | null | undefined): string => {
    const n = Number(value ?? 0);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(n);
};

const formatDate = (value: string | Date | null | undefined): string => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return String(value);
    }
};

const na = (v: string | null | undefined): string => v?.trim() || '—';

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    pending:    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    processing: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    shipped:    'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    completed:  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    cancelled:  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
    paid:       'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    downpaid:   'bg-teal-500/15 text-teal-700 dark:text-teal-300',
    unpaid:     'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    pending:    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    refunded:   'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    failed:     'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
    icon: Icon,
    label,
}: {
    icon: React.ElementType;
    label: string;
}) {
    return (
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" /> {label}
        </h3>
    );
}

function InfoRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {label}
            </p>
            <p className={cn('text-sm font-medium text-foreground break-words', mono && 'font-mono text-xs')}>
                {value || '—'}
            </p>
        </div>
    );
}

function AmountRow({
    label,
    value,
    bold = false,
    large = false,
}: {
    label: string;
    value: string;
    bold?: boolean;
    large?: boolean;
}) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className={cn('text-muted-foreground', bold && 'font-semibold text-foreground')}>
                {label}
            </span>
            <span className={cn('tabular-nums', bold ? 'font-bold text-foreground' : 'font-medium text-foreground', large && 'text-base')}>
                {value}
            </span>
        </div>
    );
}

// ─── Loading / Error skeletons ────────────────────────────────────────────────

function ModalShell({
    open,
    onClose,
    trackingNumber,
    statusKey,
    payStatusKey,
    status,
    paymentStatus,
    headerActions,
    children,
}: {
    open: boolean;
    onClose: () => void;
    trackingNumber: string;
    statusKey: string;
    payStatusKey: string;
    status: string;
    paymentStatus: string;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
            <DialogContent className="max-w-2xl w-full rounded-none sm:rounded-lg max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <DialogTitle className="text-sm font-semibold tracking-tight">
                            Order Details
                        </DialogTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                variant="outline"
                                className={cn(
                                    'rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                    STATUS_STYLES[statusKey] ?? 'bg-muted text-muted-foreground'
                                )}
                            >
                                {status}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'rounded-full border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                    PAYMENT_STATUS_STYLES[payStatusKey] ?? 'bg-muted text-muted-foreground'
                                )}
                            >
                                {paymentStatus}
                            </Badge>
                            {headerActions}
                        </div>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground mt-1">
                        {trackingNumber}
                    </p>
                    <DialogDescription className="sr-only">
                        Full details for order {trackingNumber}, including customer info, items, and payment history.
                    </DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    const open = order !== null;

    const { data, isLoading, isError } = useQuery<AdminOrderResponse>({
        queryKey: ['admin-order-detail', order?.id],
        queryFn: async () => {
            const res = await axiosApiClient.get(`/orders/${order!.id}/admin`);
            return res.data;
        },
        enabled: open && !!order?.id,
        staleTime: 30_000,
    });

    // ── Early exit: modal closed ─────────────────────────────────────────────
    if (!order) return null;

    const statusKey    = order.status?.toLowerCase() ?? '';
    const payStatusKey = order.paymentStatus?.toLowerCase() ?? '';

    // ── Loading state ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <ModalShell
                open={open}
                onClose={onClose}
                trackingNumber={order.trackingNumber}
                statusKey={statusKey}
                payStatusKey={payStatusKey}
                status={order.status}
                paymentStatus={order.paymentStatus}
            >
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em]">Loading details…</p>
                </div>
            </ModalShell>
        );
    }

    // ── Error state ──────────────────────────────────────────────────────────
    if (isError || !data?.success || !data?.data?.order) {
        return (
            <ModalShell
                open={open}
                onClose={onClose}
                trackingNumber={order.trackingNumber}
                statusKey={statusKey}
                payStatusKey={payStatusKey}
                status={order.status}
                paymentStatus={order.paymentStatus}
            >
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em]">
                        Failed to load order details.
                    </p>
                </div>
            </ModalShell>
        );
    }

    // ── Destructure full data ────────────────────────────────────────────────
    const { order: o, items, payments } = data.data;

    const orderItems  = items    ?? [];
    const paymentRows = payments ?? [];

    const fullName = [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || 'Unknown Customer';

    // Build address lines
    const addressParts = [
        o.deliveryUnitFloor,
        o.deliveryStreet,
        o.deliveryBarangay,
        o.deliveryCity,
        o.deliveryProvince,
        o.deliveryZipCode,
    ].filter(Boolean);
    const formattedAddress = o.deliveryFormattedAddress ?? (addressParts.length > 0 ? addressParts.join(', ') : null);

    // Financial derived
    const subtotal       = o.subtotal       ? Number(o.subtotal)       : null;
    const vat            = o.vat            ? Number(o.vat)            : null;
    const deliveryFee    = o.deliveryFee    ? Number(o.deliveryFee)    : null;

    // Re-run the delivery fee helper on the saved address so we can distinguish
    // "Free Shipping" (Metro Manila) from "To be quoted" (unknown area) when
    // the stored fee is 0.00.  This is display-only — no formula is changed.
    const deliveryFeeStatus = getDeliveryFee({
        city:        o.deliveryCity,
        province:    o.deliveryProvince,
        fullAddress: o.deliveryFormattedAddress,
    }).status;
    const totalAmount    = Number(o.totalAmount    ?? 0);
    const downpayment    = Number(o.downpaymentAmount ?? 0);
    const balance        = Number(o.balanceAmount    ?? 0);

    const oStatusKey    = o.status?.toLowerCase() ?? '';
    const oPayStatusKey = o.paymentStatus?.toLowerCase() ?? '';

    // ── Print handler ────────────────────────────────────────────────────────
    const handlePrint = useCallback(() => {
        const fc = (v: number | string | null | undefined) => {
            const n = Number(v ?? 0);
            if (isNaN(n)) return '—';
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
        };
        const fd = (v: string | Date | null | undefined) => {
            if (!v) return '—';
            try { return new Date(v).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
            catch { return String(v); }
        };

        const itemRows = orderItems.map((item) => {
            const hasPromo = !!item.regularUnitPrice && item.regularUnitPrice !== item.unitPrice;
            const discountLabel = hasPromo && item.discountType && item.discountValue != null
                ? ` [${promoLabel(item.discountType, item.discountValue)}]`
                : '';
            return `
            <tr>
                <td>${item.productName}${item.productCode ? `<br/><span class="mono">${item.productCode}</span>` : ''}</td>
                <td>${item.colorName ?? '—'}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${hasPromo ? `<span style="text-decoration:line-through;color:#999;font-size:10px">${fc(item.regularUnitPrice)}</span><br/>${fc(item.unitPrice)}${discountLabel}` : fc(item.unitPrice)}</td>
                <td class="right bold">${fc(item.subtotal)}</td>
            </tr>`;
        }).join('');

        const paymentRowsHtml = paymentRows.map((p) => {
            const amt = p.amountPaid ?? p.amountDue;
            return `<div class="pay-row">
                <div>
                    <strong class="capitalize">${p.paymentType}</strong>
                    ${p.paymentMethod ? `<span class="sub"> · via ${p.paymentMethod}</span>` : ''}<br/>
                    <span class="sub">${p.paidAt ? 'Paid: ' + fd(p.paidAt) : p.createdAt ? 'Created: ' + fd(p.createdAt) : ''}</span>
                    ${p.amountDue && p.amountPaid ? `<br/><span class="sub">Due: ${fc(p.amountDue)} · Paid: ${fc(p.amountPaid)}</span>` : ''}
                </div>
                <div class="right">${amt ? `<strong>${fc(amt)}</strong>` : ''}<br/><span class="badge">${p.status.toUpperCase()}</span></div>
            </div>`;
        }).join('');

        const addrBlock = formattedAddress
            ? `<p><strong>Address:</strong> ${formattedAddress}</p>`
            : addressParts.length > 0 ? `<p><strong>Address:</strong> ${addressParts.join(', ')}</p>` : '';

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Order ${o.trackingNumber} — MJ Decors</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 28px 36px; }
  .brand { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
  .brand h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .brand span { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; }
  .doc-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .doc-meta { font-size: 10px; color: #888; margin-bottom: 20px; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 14px 0; }
  .section-heading { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #888; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 20px; margin-bottom: 4px; }
  .field label { display: block; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #999; margin-bottom: 2px; }
  .field p { font-size: 11.5px; font-weight: 500; }
  .mono { font-family: monospace; font-size: 10px; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #f5f5f5; }
  th { padding: 7px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #666; border-bottom: 1px solid #ddd; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .totals { background: #fafafa; border: 1px solid #e8e8e8; border-radius: 6px; padding: 14px 18px; }
  .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
  .totals-row.grand { border-top: 1px solid #ddd; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 14px; }
  .pay-row { display: flex; justify-content: space-between; align-items: flex-start; border: 1px solid #eee; border-radius: 5px; padding: 10px 14px; margin-bottom: 6px; font-size: 11px; }
  .capitalize { text-transform: capitalize; }
  .sub { font-size: 10px; color: #888; }
  .badge { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; background: #f0f0f0; padding: 2px 6px; border-radius: 99px; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #aaa; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="brand"><h1>MJ Decors</h1><span>Admin Copy</span></div>
  <p class="doc-title">Order Details</p>
  <p class="doc-meta">Tracking: ${o.trackingNumber} &nbsp;·&nbsp; Ref: ${o.referenceNumber} &nbsp;·&nbsp; Status: ${o.status.toUpperCase()} &nbsp;·&nbsp; Payment: ${o.paymentStatus.toUpperCase()}</p>
  <hr/>

  <p class="section-heading">Order Summary</p>
  <div class="grid">
    <div class="field"><label>Order Type</label><p>${o.orderType}</p></div>
    <div class="field"><label>Payment Method</label><p>${o.paymentMethod}</p></div>
    <div class="field"><label>Order Date</label><p>${fd(o.createdAt)}</p></div>
    ${o.confirmedAt ? `<div class="field"><label>Confirmed At</label><p>${fd(o.confirmedAt)}</p></div>` : ''}
    ${o.cancelledAt ? `<div class="field"><label>Cancelled At</label><p>${fd(o.cancelledAt)}</p></div>` : ''}
    ${o.cancellationReason ? `<div class="field" style="grid-column:1/-1"><label>Cancellation Reason</label><p>${o.cancellationReason}</p></div>` : ''}
  </div>
  <hr/>

  <p class="section-heading">Customer Details</p>
  <div class="grid">
    <div class="field"><label>Full Name</label><p>${fullName}</p></div>
    <div class="field"><label>Email</label><p>${o.customerEmail ?? '—'}</p></div>
    <div class="field"><label>Phone</label><p>${o.customerPhone ?? '—'}</p></div>
    ${o.customerPhoneSecondary ? `<div class="field"><label>Alt. Phone</label><p>${o.customerPhoneSecondary}</p></div>` : ''}
  </div>
  ${addrBlock ? `<div style="margin-top:6px;font-size:11px;">${addrBlock}${o.deliveryNotes ? `<p><strong>Notes:</strong> ${o.deliveryNotes}</p>` : ''}</div>` : ''}
  <hr/>

  <p class="section-heading">Ordered Items (${orderItems.length})</p>
  ${orderItems.length === 0
    ? '<p style="font-size:11px;color:#888">No items found for this order.</p>'
    : `<table><thead><tr><th>Product</th><th>Color</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>`
  }
  <hr/>

  <p class="section-heading">Payment Summary</p>
  <div class="totals">
    ${subtotal !== null ? `<div class="totals-row"><span>Subtotal (before VAT)</span><span>${fc(subtotal)}</span></div>` : ''}
    ${vat !== null && vat > 0 ? `<div class="totals-row"><span>VAT (12%)</span><span>${fc(vat)}</span></div>` : ''}
    ${`<div class="totals-row"><span>Delivery / Installation</span><span>${deliveryFee !== null && deliveryFee > 0 ? fc(deliveryFee) : deliveryFeeStatus === 'free' ? 'Free Shipping' : 'To be quoted'}</span></div>`}
    <div class="totals-row grand"><span>Grand Total</span><span>${fc(totalAmount)}</span></div>
    <div class="totals-row" style="margin-top:6px"><span>Down Payment</span><span>${fc(downpayment)}</span></div>
    ${o.downpaymentStatus ? `<div class="totals-row"><span>Downpayment Status</span><span>${o.downpaymentStatus.toUpperCase()}</span></div>` : ''}
    ${o.downpaymentPaidAt ? `<div class="totals-row"><span>Downpayment Paid On</span><span>${fd(o.downpaymentPaidAt)}</span></div>` : ''}
    <div class="totals-row" style="border-top:1px solid #ddd;margin-top:6px;padding-top:8px;font-weight:600"><span>Balance Due</span><span>${fc(balance)}</span></div>
    ${o.balancePaidAt ? `<div class="totals-row"><span>Balance Paid On</span><span>${fd(o.balancePaidAt)}</span></div>` : ''}
  </div>
  <hr/>

  <p class="section-heading">Payment History (${paymentRows.length})</p>
  ${paymentRows.length === 0 ? '<p style="font-size:11px;color:#888">No payment records found.</p>' : paymentRowsHtml}

  <div class="footer">Generated on ${new Date().toLocaleString('en-PH')} &nbsp;·&nbsp; MJ Decors Admin Panel</div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=800,height=900');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        // Small delay so styles render before the print dialog opens
        setTimeout(() => { win.print(); win.close(); }, 400);
    }, [o, orderItems, paymentRows, formattedAddress, addressParts, subtotal, vat, deliveryFee, deliveryFeeStatus, totalAmount, downpayment, balance, fullName]);

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            trackingNumber={o.trackingNumber}
            statusKey={oStatusKey}
            payStatusKey={oPayStatusKey}
            status={o.status}
            paymentStatus={o.paymentStatus}
            headerActions={
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-7 gap-1.5 rounded-none border-border text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                </Button>
            }
        >
            <div className="flex flex-col gap-0 divide-y divide-border">

                {/* ── 1. Order Summary ── */}
                <section className="px-6 py-5">
                    <SectionHeading icon={Hash} label="Order Summary" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        <InfoRow label="Tracking #"      value={o.trackingNumber} mono />
                        <InfoRow label="Reference #"     value={o.referenceNumber} mono />
                        <InfoRow label="Order Type"      value={o.orderType} />
                        <InfoRow label="Payment Method"  value={o.paymentMethod} />
                        <InfoRow label="Order Date"      value={formatDate(o.createdAt)} />
                        <InfoRow label="Last Updated"    value={formatDate(o.updatedAt)} />
                        {o.confirmedAt && (
                            <InfoRow label="Confirmed At"  value={formatDate(o.confirmedAt)} />
                        )}
                        {o.cancelledAt && (
                            <InfoRow label="Cancelled At"  value={formatDate(o.cancelledAt)} />
                        )}
                        {o.cancellationReason && (
                            <div className="col-span-2 sm:col-span-3">
                                <InfoRow label="Cancellation Reason" value={o.cancellationReason} />
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 2. Customer Details ── */}
                <section className="px-6 py-5">
                    <SectionHeading icon={User} label="Customer Details" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        <InfoRow label="Full Name"  value={fullName} />
                        <InfoRow label="Email"      value={na(o.customerEmail)} />
                        <InfoRow label="Phone"      value={na(o.customerPhone)} />
                        {o.customerPhoneSecondary && (
                            <InfoRow label="Alt. Phone" value={o.customerPhoneSecondary} />
                        )}
                    </div>
                </section>

                {/* ── 3. Delivery Address ── */}
                {(formattedAddress ?? addressParts.length > 0) && (
                    <section className="px-6 py-5">
                        <SectionHeading icon={MapPin} label="Delivery Address" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                            {o.deliveryUnitFloor && (
                                <InfoRow label="Unit / Floor"  value={o.deliveryUnitFloor} />
                            )}
                            {o.deliveryStreet && (
                                <InfoRow label="Street"        value={o.deliveryStreet} />
                            )}
                            {o.deliveryBarangay && (
                                <InfoRow label="Barangay"      value={o.deliveryBarangay} />
                            )}
                            {o.deliveryCity && (
                                <InfoRow label="City"          value={o.deliveryCity} />
                            )}
                            {o.deliveryProvince && (
                                <InfoRow label="Province"      value={o.deliveryProvince} />
                            )}
                            {o.deliveryZipCode && (
                                <InfoRow label="ZIP Code"      value={o.deliveryZipCode} />
                            )}
                            {formattedAddress && (
                                <div className="col-span-2 sm:col-span-3">
                                    <InfoRow label="Full Address" value={formattedAddress} />
                                </div>
                            )}
                            {o.deliveryNotes && (
                                <div className="col-span-2 sm:col-span-3">
                                    <InfoRow label="Delivery Notes" value={o.deliveryNotes} />
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── 4. Ordered Items ── */}
                <section className="px-6 py-5">
                    <SectionHeading
                        icon={ShoppingCart}
                        label={`Ordered Items (${orderItems.length})`}
                    />
                    {orderItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No items found for this order.</p>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        {['Product', 'Color', 'Qty', 'Unit Price', 'Total'].map((h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map((item) => {
                                        const hasPromo =
                                            !!item.regularUnitPrice &&
                                            item.regularUnitPrice !== item.unitPrice;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-t border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-foreground text-sm leading-tight">
                                                        {item.productName}
                                                    </p>
                                                    {item.productCode && (
                                                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                            {item.productCode}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                                    {item.colorName ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {hasPromo ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            {/* Promo badge */}
                                                            {item.discountType && item.discountValue != null && (
                                                                <span className="self-start inline-flex items-center gap-1 text-[8px] font-semibold uppercase tracking-widest px-1.5 py-0.5 bg-rose-600 text-white leading-none">
                                                                    <Tag className="w-2 h-2" strokeWidth={2} />
                                                                    {promoLabel(item.discountType, item.discountValue)}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                                                                {formatCurrency(item.regularUnitPrice)}
                                                            </span>
                                                            <span className="text-sm font-medium text-rose-600 tabular-nums">
                                                                {formatCurrency(item.unitPrice)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm tabular-nums text-foreground">
                                                            {formatCurrency(item.unitPrice)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
                                                    {formatCurrency(item.subtotal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* ── 5. Payment / Totals ── */}
                <section className="px-6 py-5">
                    <SectionHeading icon={Receipt} label="Payment Summary" />
                    <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 flex flex-col gap-2.5">
                        {subtotal !== null && (
                            <AmountRow label="Subtotal (before VAT)" value={formatCurrency(subtotal)} />
                        )}
                        {vat !== null && vat > 0 && (
                            <AmountRow label="VAT (12%)" value={formatCurrency(vat)} />
                        )}
                        {/* Always render — status determines label: ₱X,XXX / Free Shipping / To be quoted */}
                        <AmountRow
                            label="Delivery / Installation"
                            value={
                                deliveryFee !== null && deliveryFee > 0
                                    ? formatCurrency(deliveryFee)
                                    : deliveryFeeStatus === 'free'
                                    ? 'Free Shipping'
                                    : 'To be quoted'
                            }
                        />
                        <Separator className="my-0.5" />
                        <AmountRow label="Grand Total"   value={formatCurrency(totalAmount)} bold />
                        <AmountRow label="Down Payment"  value={formatCurrency(downpayment)} />
                        {o.downpaymentStatus && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Downpayment Status</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'rounded-full border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]',
                                        PAYMENT_STATUS_STYLES[o.downpaymentStatus.toLowerCase()] ?? 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {o.downpaymentStatus}
                                </Badge>
                            </div>
                        )}
                        {o.downpaymentPaidAt && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Downpayment paid on</span>
                                <span>{formatDate(o.downpaymentPaidAt)}</span>
                            </div>
                        )}
                        <Separator className="my-0.5" />
                        <AmountRow label="Balance Due" value={formatCurrency(balance)} bold large />
                        {o.balancePaidAt && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Balance paid on</span>
                                <span>{formatDate(o.balancePaidAt)}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 6. Payment History ── */}
                <section className="px-6 py-5">
                    <SectionHeading
                        icon={CreditCard}
                        label={`Payment History (${paymentRows.length})`}
                    />
                    {paymentRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payment records found.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {paymentRows.map((p) => {
                                const pStatusKey = p.status?.toLowerCase() ?? '';
                                const amount = p.amountPaid ?? p.amountDue;
                                return (
                                    <div
                                        key={p.id}
                                        className="rounded-lg border border-border bg-card px-4 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-medium text-foreground capitalize">
                                                    {p.paymentType}
                                                </p>
                                                {p.paymentMethod && (
                                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                                        via {p.paymentMethod}
                                                    </p>
                                                )}
                                                {p.paidAt ? (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        Paid: {formatDate(p.paidAt)}
                                                    </p>
                                                ) : p.createdAt ? (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        Created: {formatDate(p.createdAt)}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {amount && (
                                                    <span className="text-sm font-semibold tabular-nums text-foreground">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'rounded-full border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]',
                                                        PAYMENT_STATUS_STYLES[pStatusKey] ?? 'bg-muted text-muted-foreground'
                                                    )}
                                                >
                                                    {p.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        {/* Amount due vs paid comparison */}
                                        {p.amountDue && p.amountPaid && (
                                            <div className="mt-2 flex gap-4 text-xs text-muted-foreground border-t border-border pt-2">
                                                <span>Due: <span className="font-medium text-foreground">{formatCurrency(p.amountDue)}</span></span>
                                                <span>Paid: <span className="font-medium text-foreground">{formatCurrency(p.amountPaid)}</span></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>
        </ModalShell>
    );
}
