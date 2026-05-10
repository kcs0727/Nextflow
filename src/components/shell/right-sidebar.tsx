"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowRunHistory } from "@/types/workflow";

type RightSidebarProps = {
  runs: WorkflowRunHistory[];
  workflowName?: string;
};

const statusClasses: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  partial: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  running: "bg-amber-500/15 text-amber-300 border-amber-500/40",
};

export function RightSidebar({ runs, workflowName }: RightSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <aside className="krea-scroll w-[350px] overflow-y-auto border-l border-secondary/10 bg-primary p-4 backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-[0.1em] text-text2">Workflow History</h2>
        {workflowName && (
          <p className="mt-1 text-xs text-text4">Project: {workflowName}</p>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto pr-1">
        {runs.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-buttonbg p-3 text-xs text-text5">
            No runs yet. Execute a node, selected group, or full workflow.
          </p>
        ) : null}

        {runs.map((run) => {
          const isOpen = expanded === run.id;
          return (
            <div key={run.id} className="rounded-xl border border-secondary/10 bg-buttonbg">
              <button
                onClick={() => setExpanded(isOpen ? null : run.id)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
              >
                <div>
                  <p className="text-xs text-text3">
                    {format(new Date(run.createdAt), "MMM d, yyyy h:mm:ss a")}
                  </p>
                  <p className="mt-1 text-[11px] text-text4">
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
                  {isOpen ? <ChevronUp className="h-4 w-4 text-text4" /> : <ChevronDown className="h-4 w-4 text-text4" />}
                </div>
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t border-secondary/10 p-3">
                  {run.nodeRuns.map((node) => (
                    <div key={node.id} className="rounded-lg border border-secondary/10 bg-primary p-2">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-xs text-text2">
                          {node.nodeType} ({node.nodeId})
                        </p>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", statusClasses[node.status])}>
                          {node.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text4">{node.durationMs}ms</p>
                      
                      {/* Show outputs */}
                      {node.outputs && Object.keys(node.outputs).length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-secondary/10 pt-2">
                          {Object.entries(node.outputs).map(([key, value]) => (
                            <div key={key} className="text-[10px]">
                              <p className="text-text4">{key}:</p>
                              <p className="break-all text-text3 max-h-12 overflow-hidden">
                                {typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:')) ? (
                                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                    {value.length > 50 ? value.substring(0, 50) + '...' : value}
                                  </a>
                                ) : (
                                  <span>{String(value).substring(0, 80)}</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

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
