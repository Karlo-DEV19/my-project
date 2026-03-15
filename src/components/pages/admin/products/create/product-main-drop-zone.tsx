import { memo, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Plus } from 'lucide-react';
import { ALLOWED_MIME, MAX_BYTES } from '@/lib/supabase/fileUpload';


interface MainDropZoneProps {
    files: File[];
    onChange: (files: File[]) => void;
    error?: string;
}

export const MainDropZone = memo(({ files, onChange, error }: MainDropZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const process = useCallback(
        (list: FileList | null) => {
            if (!list) return;
            const valid = Array.from(list).filter(f => ALLOWED_MIME.includes(f.type) && f.size <= MAX_BYTES);
            onChange([...files, ...valid].slice(0, 6));
        },
        [files, onChange],
    );

    const coverPreview = files[0] ? URL.createObjectURL(files[0]) : null;
    const extraPreviews = files.slice(1).map(f => URL.createObjectURL(f));

    return (
        <div className="flex flex-col gap-3">

            {/* Cover drop area */}
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={[
                    'relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all',
                    dragging ? 'border-primary bg-primary/5'
                        : coverPreview ? 'border-transparent'
                            : error ? 'border-destructive/50'
                                : 'border-border bg-muted/30 hover:border-primary/50',
                ].join(' ')}
            >
                {coverPreview ? (
                    <>
                        <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized sizes="50vw" />
                        <Badge className="absolute left-2 top-2 text-[10px]">Cover</Badge>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(files.filter((_, i) => i !== 0)); }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${dragging ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
                            <Upload className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{dragging ? 'Drop to upload' : 'Upload cover image'}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG, WEBP · Max 10 MB</p>
                        </div>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { process(e.target.files); e.target.value = ''; }}
                />
            </div>

            {/* Extra thumbnails */}
            {files.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {extraPreviews.map((src, i) => (
                        <div key={i} className="group relative aspect-square w-16 overflow-hidden rounded-lg border bg-muted">
                            <Image src={src} alt={`img-${i + 2}`} fill className="object-cover" unoptimized sizes="64px" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                                <button
                                    type="button"
                                    onClick={() => onChange(files.filter((_, idx) => idx !== i + 1))}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 group-hover:opacity-100"
                                >
                                    <X className="h-3 w-3 text-gray-800" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {files.length < 6 && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex aspect-square w-16 items-center justify-center rounded-lg border border-dashed hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                    <span className="self-center text-[11px] text-muted-foreground">{files.length} / 6</span>
                </div>
            )}

            {error && <p className="text-[12px] font-medium text-destructive">{error}</p>}
        </div>
    );
});

MainDropZone.displayName = 'MainDropZone';