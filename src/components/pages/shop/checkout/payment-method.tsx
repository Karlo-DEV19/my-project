'use client';

import React from 'react';
import Image from 'next/image';
import { CreditCard } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethodId = 'gcash' | 'paymaya';

export interface PaymentOption {
    id: PaymentMethodId;
    label: string;
    description: string;
    imagePath: string;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS: PaymentOption[] = [
    {
        id: 'gcash',
        label: 'GCash',
        description: 'Pay via GCash e-wallet',
        imagePath: '/payments-icon/gcash.png',
    },
    {
        id: 'paymaya',
        label: 'PayMaya',
        description: 'Pay via Maya e-wallet',
        imagePath: '/payments-icon/paymaya.png',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface PaymentMethodProps {
    value: PaymentMethodId | null;
    onChange: (id: PaymentMethodId) => void;
    error?: string;
}

const PaymentMethod = ({ value, onChange, error }: PaymentMethodProps) => {
    return (
        <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map(option => {
                const isSelected = value === option.id;
                return (
                    <label
                        key={option.id}
                        className={`flex items-center gap-4 px-4 py-4 border cursor-pointer transition-all duration-200 select-none ${isSelected
                            ? 'border-foreground bg-foreground/[0.03]'
                            : 'border-border hover:border-foreground/40 hover:bg-accent/30'
                            }`}
                    >
                        {/* Hidden native radio */}
                        <input
                            type="radio"
                            name="paymentMethod"
                            value={option.id}
                            checked={isSelected}
                            onChange={() => onChange(option.id)}
                            className="sr-only"
                            aria-label={option.label}
                        />

                        {/* Custom radio indicator */}
                        <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${isSelected
                                ? 'border-foreground'
                                : 'border-border'
                                }`}
                        >
                            {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-foreground" />
                            )}
                        </div>

                        {/* Payment icon */}
                        <div className="relative w-12 h-8 shrink-0">
                            <Image
                                src={option.imagePath}
                                alt={option.label}
                                fill
                                className="object-contain"
                                sizes="48px"
                                onError={(e) => {
                                    // Fallback if image not found
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Label */}
                        <div className="flex flex-col gap-0.5 flex-1">
                            <span
                                className={`text-sm font-medium transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                            >
                                {option.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {option.description}
                            </span>
                        </div>

                        {/* Selected badge */}
                        {isSelected && (
                            <span className="shrink-0 text-[9px] uppercase tracking-widest bg-foreground text-background px-2 py-0.5 font-semibold">
                                Selected
                            </span>
                        )}
                    </label>
                );
            })}

            {error && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    {error}
                </p>
            )}
        </div>
    );
};

export default PaymentMethod;