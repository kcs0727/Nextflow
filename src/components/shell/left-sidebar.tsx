"use client";

import { useMemo, useState } from "react";
import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Home, Search, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import type { WorkflowNodeKind } from "@/types/workflow";
import { NODE_OPTIONS } from "@/components/flow/node-metadata";

type LeftSidebarProps = {
    onAddNode: (kind: WorkflowNodeKind) => void;
    onLoadSampleWorkflow: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    authenticated: boolean;
};

const QUICK_ACCESS = NODE_OPTIONS;

export function LeftSidebar({ onAddNode, onLoadSampleWorkflow, collapsed, onToggleCollapse, authenticated }: LeftSidebarProps) {
    const router = useRouter();
    const { userId } = useAuth();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const displayName = user?.fullName || user?.username || user?.firstName || "Account";
    const filteredQuickAccess = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return QUICK_ACCESS;

        return QUICK_ACCESS.filter((item) => item.label.toLowerCase().includes(query));
    }, [searchQuery]);

    const onDragStart = (event: React.DragEvent<HTMLButtonElement>, kind: WorkflowNodeKind) => {
        event.dataTransfer.setData("application/nextflow-node-kind", kind);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside
            className={`krea-scroll border-r border-secondary/6 bg-primary py-4 transition-[width,padding] duration-300 flex flex-col justify-between ${collapsed ? "w-18.5 px-2" : "w-67.5 px-3"
                }`}
        >

            <div>
                <div className="mb-6 px-2">
                    <button
                        onClick={onToggleCollapse}
                        className="rounded-lg border border-secondary/10 bg-buttonbg p-2 text-text2"
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>
                </div>

                <div className="mb-4 space-y-1 px-1">
                    <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-text1 transition-colors hover:bg-secondary/10">
                        <Home className="h-4 w-4 text-slate-700 dark:text-sky-300" />
                        {!collapsed ? <span>Home</span> : null}
                    </button>
                    <button
                        onClick={onLoadSampleWorkflow}
                        disabled={!authenticated}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text1 transition-colors hover:bg-secondary/10 disabled:opacity-40"
                        title="Load sample marketing workflow"
                    >
                        <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {!collapsed ? <span>Sample Workflow</span> : null}
                    </button>
                </div>

                {!collapsed ? (
                    <div className="mb-6 rounded-xl border border-secondary/10 bg-secondary/4 px-3 py-2">
                        <div className="flex items-center gap-2 text-text4">
                            <Search className="h-4 w-4" />
                            <input
                                className="w-full bg-transparent text-sm outline-none"
                                placeholder="Search nodes"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </div>
                    </div>
                ) : null}

                <div className="space-y-1">
                    {!collapsed ? <p className="mb-4 px-2 text-[11px] uppercase tracking-[0.2em] text-text5">Quick Access</p> : null}
                    {filteredQuickAccess.map((item) => {
                        const Icon = item.icon;

                        return (
                        <button
                            key={item.kind}
                            onClick={() => onAddNode(item.kind)}
                            draggable={authenticated}
                            onDragStart={(event) => onDragStart(event, item.kind)}
                            disabled={!authenticated}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text1 transition-colors hover:bg-secondary/10 disabled:opacity-40"
                        >
                            <span className={item.iconClassName}><Icon className="h-4 w-4" /></span>
                            {!collapsed ? <span>{item.label}</span> : null}
                        </button>
                        );
                    })}
                    {!collapsed && filteredQuickAccess.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-text4">No matching nodes found.</p>
                    ) : null}
                </div>
            </div>
            <div className="mt-auto px-1 pt-4">
                {userId ? (
                    <div className="flex items-center gap-3 rounded-lg hover:bg-secondary/10 px-2 py-2">
                        <UserButton />
                        {!collapsed ? <span className="max-w-36.25 truncate text-sm font-semibold text-text1">{displayName}</span> : null}
                    </div>
                ) : (
                    <SignInButton mode="modal">
                        <button className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#15161a] px-3 py-2 text-left text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10">
                            <span className="block h-4 w-4 rounded-full border border-zinc-400" />
                            {!collapsed ? <span>Sign In</span> : null}
                        </button>
                    </SignInButton>
                )}
            </div>
        </aside>
    );
}
