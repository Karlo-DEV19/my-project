'use client';

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { SearchableCombobox } from '@/components/ui/combobox';
import type { FormValues } from './zod-product-schema';
import { SwatchDropZone } from './swatch-drop-zone';

interface ColorRowProps {
    index: number;
    onRemove: () => void;
    canRemove: boolean;
}

const COLOR_OPTIONS = [
    { label: 'Ivory', value: 'Ivory' },
    { label: 'Off White', value: 'Off White' },
    { label: 'Cream', value: 'Cream' },
    { label: 'Beige', value: 'Beige' },
    { label: 'Sand', value: 'Sand' },
    { label: 'Champagne', value: 'Champagne' },
    { label: 'Light Gray', value: 'Light Gray' },
    { label: 'Gray', value: 'Gray' },
    { label: 'Deep Gray', value: 'Deep Gray' },
    { label: 'Charcoal', value: 'Charcoal' },
    { label: 'Black', value: 'Black' },
    { label: 'White', value: 'White' },
    { label: 'Brown', value: 'Brown' },
    { label: 'Mocha', value: 'Mocha' },
    { label: 'Caramel', value: 'Caramel' },
    { label: 'Navy Blue', value: 'Navy Blue' },
    { label: 'Sky Blue', value: 'Sky Blue' },
    { label: 'Dusty Blue', value: 'Dusty Blue' },
    { label: 'Forest Green', value: 'Forest Green' },
    { label: 'Sage Green', value: 'Sage Green' },
    { label: 'Terracotta', value: 'Terracotta' },
    { label: 'Blush Pink', value: 'Blush Pink' },
];

export const ColorRow = memo(({ index, onRemove, canRemove }: ColorRowProps) => {
    const { control, formState: { errors } } = useFormContext<FormValues>();
    const rowErr = errors.availableColors?.[index];

    return (
        <div className="flex w-full items-center gap-2">

            {/* Swatch drop zone — fixed width, never grows */}
            <FormField
                control={control}
                name={`availableColors.${index}.file`}
                render={({ field }) => (
                    <FormItem className="m-0 shrink-0 space-y-0">
                        <FormControl>
                            <SwatchDropZone
                                file={field.value as File | null}
                                onChange={field.onChange}
                                error={rowErr?.file?.message}
                            />
                        </FormControl>
                        {rowErr?.file?.message && (
                            <p className="mt-0.5 text-center text-[10px] leading-tight text-destructive">
                                {rowErr.file.message}
                            </p>
                        )}
                    </FormItem>
                )}
            />

            {/* Combobox — isolated stacking context (z-0) so delete button (z-10) always wins */}
            <div className="w-[180px] shrink-0 relative z-0">
                <FormField
                    control={control}
                    name={`availableColors.${index}.name`}
                    render={({ field }) => (
                        <FormItem className="space-y-0">
                            <FormControl>
                                <SearchableCombobox
                                    options={COLOR_OPTIONS}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Color name…"
                                />
                            </FormControl>
                            <FormMessage className="mt-0.5 text-[11px]" />
                        </FormItem>
                    )}
                />
            </div>

            {/* Delete — relative z-10 guarantees it's always above the combobox (z-0) */}
            {canRemove ? (
                <button
                    type="button"
                    onClick={onRemove}
                    className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-red-300 hover:text-red-500"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            ) : (
                <div className="h-7 w-7 shrink-0" />
            )}
        </div>
    );
});

ColorRow.displayName = 'ColorRow';