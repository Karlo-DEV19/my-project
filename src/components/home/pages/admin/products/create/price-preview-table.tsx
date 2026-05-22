import { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Calculator, Info } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormValues } from './zod-product-schema';

// ─── Pricing Constants ─────────────────────────────────────────────────────────

const SQFT_FACTOR = 10.76;
const MIN_SQFT = 10;

const STANDARD_SIZES = [
    { label: '60 × 120', w: 60, h: 120 },
    { label: '90 × 150', w: 90, h: 150 },
    { label: '120 × 160', w: 120, h: 160 },
    { label: '120 × 200', w: 120, h: 200 },
    { label: '150 × 200', w: 150, h: 200 },
    { label: '160 × 220', w: 160, h: 220 },
    { label: '180 × 220', w: 180, h: 220 },
    { label: '200 × 240', w: 200, h: 240 },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcBlindPrice(widthCm: number, heightCm: number, unitPrice: number) {
    const measured = (widthCm / 100) * (heightCm / 100) * SQFT_FACTOR;
    const billable = Math.max(measured, MIN_SQFT);
    return { measured, billable, total: unitPrice * billable };
}

const fmtPHP = (n: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────

export const PricePreviewTable = memo(() => {
    const { control } = useFormContext<FormValues>();
    const unitPrice = useWatch({ control, name: 'unitPrice' });
    const price = Number(unitPrice);

    if (!price || price <= 0) {
        return (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                <div className="flex flex-col items-center gap-2">
                    <Calculator className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">Enter a unit price to see the price table</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" strokeWidth={1.5} />
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>Formula:</strong>{' '}
                    <code className="font-mono">billable = MAX(W × H × 10.76, 10 sq.ft) · total = unit_price × billable</code>
                </p>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="text-[10px] uppercase tracking-widest h-8">Size (cm)</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">Measured</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">Billable</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest h-8 text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {STANDARD_SIZES.map(({ label, w, h }) => {
                            const c = calcBlindPrice(w, h, price);
                            const isMin = c.measured < MIN_SQFT;
                            return (
                                <TableRow key={label} className="text-xs">
                                    <TableCell className="font-medium py-2">{label}</TableCell>
                                    <TableCell className="text-right py-2 text-muted-foreground">{c.measured.toFixed(2)}</TableCell>
                                    <TableCell className="text-right py-2">
                                        <span className={isMin ? 'text-amber-600 font-medium' : ''}>{c.billable.toFixed(2)}</span>
                                        {isMin && <span className="ml-1 text-[9px] text-amber-500">min</span>}
                                    </TableCell>
                                    <TableCell className="text-right py-2 font-semibold">{fmtPHP(c.total)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-t">
                    1 panel (0L + 1R). Amber = minimum 10 sq.ft applied.
                </p>
            </div>
        </div>
    );
});
PricePreviewTable.displayName = 'PricePreviewTable';