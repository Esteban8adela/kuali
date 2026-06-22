"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  label: string;
  content: string;
  className?: string;
}

export function InfoTooltip({ label, content, className }: InfoTooltipProps) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1B3A4B]/15 text-[#1B3A4B] transition hover:border-[#C4A052]/50 hover:bg-[#C4A052]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A052]/40"
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-[#C4A052]/25 bg-white px-3 py-2 text-left text-sm leading-snug text-neutral-800 shadow-lg group-hover:visible group-focus-within:visible"
      >
        {content}
      </span>
    </span>
  );
}
