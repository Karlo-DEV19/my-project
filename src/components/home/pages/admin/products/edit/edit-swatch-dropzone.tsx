'use client';

import { memo, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ImageIcon, Link, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

interface EditSwatchDropZoneProps {
    value: File | string | null;
    onChange: (value: File | string | null) => void;
    error?: string;
}

export const EditSwatchDropZone = memo(({ value, onChange, error }: EditSwatchDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const [mode, setMode] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Derive preview URL from either a File or a string
    const preview =
        value instanceof File
            ? URL.createObjectURL(value)
            : typeof value === 'string' && value.trim().length > 0
            ? value
            : null;

    const processFile = useCallback(
        (list: FileList | null) => {
            const f = list
                ? Array.from(list).find(
                      (f) => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES
                  )
                : null;
            onChange(f ?? null);
        },
        [onChange]
    );

    const commitUrl = useCallback(() => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        try {
            new URL(trimmed);
            onChange(trimmed);
            setUrlInput('');
        } catch {
            // invalid URL — do nothing (validation handled by zod)
        }
    }, [urlInput, onChange]);

    return (
        <div className="flex flex-col gap-1.5">
            {/* Mode toggle */}
            {!preview && (
                <div className="flex gap-0.5 p-0.5 bg-muted rounded-md w-fit">
                    {(['upload', 'url'] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                                mode === m
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {m === 'upload' ? (
                                <Upload className="h-2.5 w-2.5" />
                            ) : (
                                <Link className="h-2.5 w-2.5" />
                            )}
                            {m === 'upload' ? 'File' : 'URL'}
                        </button>
                    ))}
                </div>
            )}

            {mode === 'upload' || preview ? (
                <div
                    onClick={() => !preview && inputRef.current?.click()}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        processFile(e.dataTransfer.files);
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    className={cn(
                        'relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                        dragging
                            ? 'border-primary bg-primary/5'
                            : preview
                            ? 'border-primary/30 cursor-default'
                            : error
                            ? 'border-destructive/50'
                            : 'border-border hover:border-primary/40'
                    )}
                >
                    {preview ? (
                        <>
                            <Image
                                src={preview}
                                alt="Swatch"
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="80px"
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onChange(null); setUrlInput(''); }}
                                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-[9px] text-muted-foreground">Swatch</span>
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => { processFile(e.target.files); e.target.value = ''; }}
                    />
                </div>
            ) : (
                // URL mode — inline input
                <div className="flex gap-1.5 items-center">
                    <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commitUrl())}
                        placeholder="https://…"
                        className="h-8 text-[11px] w-44"
                    />
                    <button
                        type="button"
                        onClick={commitUrl}
                        disabled={!urlInput.trim()}
                        className="shrink-0 h-8 px-2 rounded-md text-[11px] bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                    >
                        Add
                    </button>
                </div>
            )}

            {error && (
                <p className="text-[10px] text-destructive max-w-[80px] leading-tight">{error}</p>
            )}
        </div>
    );
});

EditSwatchDropZone.displayName = 'EditSwatchDropZone';