"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {actionLabel ? (
          <Button
            onClick={onAction}
            className="h-11 rounded-none bg-primary px-6 text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              {actionLabel}
            </span>
          </Button>
        ) : null}
      </div>

      <div className="h-px w-12 bg-border" />
    </div>
  );
}

