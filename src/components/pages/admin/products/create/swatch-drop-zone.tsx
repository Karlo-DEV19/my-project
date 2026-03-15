'use client';

import { memo, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ImageIcon } from 'lucide-react';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

interface SwatchDropZoneProps {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}

export const SwatchDropZone = memo(({ file, onChange, error }: SwatchDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const preview = file ? URL.createObjectURL(file) : null;

    const process = useCallback((list: FileList | null) => {
        const f = list
            ? Array.from(list).find(f => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES)
            : null;
        onChange(f ?? null);
    }, [onChange]);

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={[
                'relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                dragging ? 'border-primary bg-primary/5'
                    : preview ? 'border-primary/30'
                        : error ? 'border-destructive/50'
                            : 'border-border hover:border-primary/40',
            ].join(' ')}
        >
            {preview ? (
                <>
                    <Image src={preview} alt="Swatch" fill className="object-cover" unoptimized sizes="80px" />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(null); }}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
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
                onChange={(e) => { process(e.target.files); e.target.value = ''; }}
            />
        </div>
    );
});

SwatchDropZone.displayName = 'SwatchDropZone';