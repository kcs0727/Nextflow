"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type NodeShellProps = {
  title: string;
  status: "idle" | "running" | "success" | "failed";
  error?: string;
  children: React.ReactNode;
};

export function NodeShell({ title, status, error, children }: NodeShellProps) {
  return (
    <div
      className={cn(
        "relative w-[300px] rounded-2xl border border-white/10 bg-[#11131a]/95 p-4 text-zinc-100 shadow-[0_16px_36px_rgba(0,0,0,0.48)] backdrop-blur-md transition-all duration-300",
        status === "running" && "animate-node-pulse ring-2 ring-blue-400/70 shadow-[0_0_0_2px_rgba(78,126,255,0.2),0_16px_36px_rgba(0,0,0,0.5)]",
        status === "failed" && "ring-1 ring-rose-400/70",
      )}
      style={
        status === "running"
          ? {
              animation: "node-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }
          : undefined
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">{title}</h3>
        {status === "running" ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
        ) : null}
      </div>

      <div className="space-y-3">{children}</div>

      {error ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-900/30 px-3 py-2 text-[11px] text-rose-200">
          <TriangleAlert className="mt-[1px] h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
