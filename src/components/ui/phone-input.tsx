"use client"

// components/pages/shop/checkout/ph-phone-input.tsx
//
// This file is intentionally isolated from checkout-form.tsx.
// It contains the `react-phone-number-input/style.css` import which
// crashes Next.js SSR when bundled into a server-rendered chunk.
// It is always loaded via dynamic(..., { ssr: false }) in checkout-form.tsx.

import { useCallback } from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

interface PhPhoneInputProps {
    value: string | undefined
    onChange: (val: string | undefined) => void
    placeholder?: string
    hasError?: boolean
}

export function PhPhoneInput({ value, onChange, placeholder, hasError }: PhPhoneInputProps) {
    // Enforce that the local part always starts with 9.
    // react-phone-number-input stores values in E.164: +639XXXXXXXXX
    // If the user types a digit other than 9 after +63, we overwrite it.
    const handleChange = useCallback(
        (val: string | undefined) => {
            if (!val) {
                onChange(val)
                return
            }
            if (val.startsWith("+63") && val.length > 3) {
                const local = val.slice(3) // digits after +63
                if (local[0] !== "9") {
                    onChange("+639" + local.slice(1))
                    return
                }
            }
            onChange(val)
        },
        [onChange]
    )

    return (
        <div
            className={`
                flex items-center h-11 border bg-transparent px-3 text-sm
                transition-colors focus-within:ring-1 focus-within:ring-ring
                ${hasError
                    ? "border-destructive focus-within:ring-destructive/50"
                    : "border-input"
                }
            `}
        >
            <PhoneInput
                international
                defaultCountry="PH"
                countries={["PH"]}
                countryCallingCodeEditable={false}
                value={value}
                onChange={handleChange}
                placeholder={placeholder ?? "e.g. 917 123 4567"}
                className="w-full text-sm bg-transparent outline-none phone-input-ph"
            />

            {/* Scoped style override — targets the library's internal elements */}
            <style>{`
                .phone-input-ph .PhoneInputInput {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.875rem;
                    color: inherit;
                    width: 100%;
                }
                .phone-input-ph .PhoneInputCountry {
                    margin-right: 8px;
                }
                .phone-input-ph .PhoneInputCountrySelectArrow {
                    display: none;
                }
            `}</style>
        </div>
    )
}