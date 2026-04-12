'use client';

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { GripVertical, Trash2 } from 'lucide-react';
import {
    FormField,
    FormItem,
    FormControl,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EditFormValues } from './edit-product-blind-zod-schema';
import { EditSwatchDropZone } from './edit-swatch-dropzone';

interface EditColorRowProps {
    index: number;
    onRemove: () => void;
    canRemove: boolean;
}

export const EditColorRow = memo(({ index, onRemove, canRemove }: EditColorRowProps) => {
    const {
        control,
        formState: { errors },
    } = useFormContext<EditFormValues>();

    const rowErr = errors.availableColors?.[index];

    return (
        <div className="relative flex flex-col gap-4 rounded-lg border bg-card p-4 hover:border-primary/20 transition-colors">
            {/* Header: Drag Handle & Delete Action */}
            <div className="flex items-center justify-between">
                <div className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                    <GripVertical className="h-4 w-4" />
                </div>
                
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {/* 1. Swatch (Top) */}
                <FormField
                    control={control}
                    name={`availableColors.${index}.file`}
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Color Swatch
                            </FormLabel>
                            <FormControl>
                                <div className="w-full">
                                    <EditSwatchDropZone
                                        value={field.value as File | string | null}
                                        onChange={field.onChange}
                                        error={rowErr?.file?.message}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />

                {/* 2. Color Name (Bottom) */}
                <FormField
                    control={control}
                    name={`availableColors.${index}.name`}
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Color Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Ivory, Deep Gray…"
                                    className="h-10 w-full"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
});

EditColorRow.displayName = 'EditColorRow';