'use client';

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { GripVertical, Trash2 } from 'lucide-react';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FormValues } from './zod-product-schema';
import { SwatchDropZone } from './swatch-drop-zone';

interface ColorRowProps {
    index: number;
    onRemove: () => void;
    canRemove: boolean;
}

export const ColorRow = memo(({ index, onRemove, canRemove }: ColorRowProps) => {
    const { control, formState: { errors } } = useFormContext<FormValues>();
    const rowErr = errors.availableColors?.[index];

    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:border-primary/20 transition-colors">
            <div className="mt-2.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Swatch */}
            <FormField
                control={control}
                name={`availableColors.${index}.file`}
                render={({ field }) => (
                    <FormItem className="m-0 shrink-0 space-y-1">
                        <SwatchDropZone
                            file={field.value as File | null}
                            onChange={field.onChange}
                            error={rowErr?.file?.message}
                        />
                        {rowErr?.file?.message && (
                            <p className="w-20 text-center text-[10px] text-destructive">{rowErr.file.message}</p>
                        )}
                    </FormItem>
                )}
            />

            {/* Name */}
            <FormField
                control={control}
                name={`availableColors.${index}.name`}
                render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                        <FormLabel className="text-xs text-muted-foreground">Color Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Ivory, Deep Gray…" className="h-9" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                    </FormItem>
                )}
            />

            {canRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="mt-6 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});

ColorRow.displayName = 'ColorRow';