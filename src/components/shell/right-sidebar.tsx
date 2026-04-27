"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowRunHistory } from "@/types/workflow";

type RightSidebarProps = {
  runs: WorkflowRunHistory[];
};

const statusClasses: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  partial: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  running: "bg-amber-500/15 text-amber-300 border-amber-500/40",
};

export function RightSidebar({ runs }: RightSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <aside className="krea-scroll w-[350px] overflow-y-auto border-l border-white/10 bg-[#0c0d13]/96 p-4 backdrop-blur-xl">
      <h2 className="mb-3 text-sm font-semibold tracking-[0.1em] text-zinc-200">Workflow History</h2>

      <div className="space-y-3 overflow-y-auto pr-1">
        {runs.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#12131b] p-3 text-xs text-zinc-500">
            No runs yet. Execute a node, selected group, or full workflow.
          </p>
        ) : null}

        {runs.map((run) => {
          const isOpen = expanded === run.id;
          return (
            <div key={run.id} className="rounded-xl border border-white/10 bg-[#12131b]">
              <button
                onClick={() => setExpanded(isOpen ? null : run.id)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
              >
                <div>
                  <p className="text-xs text-zinc-300">
                    {format(new Date(run.createdAt), "MMM d, yyyy h:mm:ss a")}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    scope: {run.scope} • {run.durationMs}ms
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      statusClasses[run.status],
                    )}
                  >
                    {run.status}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </div>
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t border-white/10 p-3">
                  {run.nodeRuns.map((node) => (
                    <div key={node.id} className="rounded-lg border border-white/10 bg-[#0d0e13] p-2">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-xs text-zinc-200">
                          {node.nodeType} ({node.nodeId})
                        </p>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", statusClasses[node.status])}>
                          {node.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{node.durationMs}ms</p>
                      {node.error ? <p className="mt-1 text-[11px] text-rose-300">{node.error}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
