"use client";

import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Home, Sparkles, Search, Type, ImagePlus, Clapperboard, Crop, Film, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import type { WorkflowNodeKind } from "@/types/workflow";

type LeftSidebarProps = {
    onAddNode: (kind: WorkflowNodeKind) => void;
    onLoadSampleWorkflow: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    authenticated: boolean;
};

const QUICK_ACCESS: Array<{ kind: WorkflowNodeKind; label: string; icon: React.ReactNode }> = [
    { kind: "text", label: "Text Node", icon: <Type className="h-4 w-4" /> },
    { kind: "uploadImage", label: "Upload Image Node", icon: <ImagePlus className="h-4 w-4" /> },
    { kind: "uploadVideo", label: "Upload Video Node", icon: <Clapperboard className="h-4 w-4" /> },
    { kind: "runAnyLlm", label: "Run Any LLM Node", icon: <Sparkles className="h-4 w-4" /> },
    { kind: "cropImage", label: "Crop Image Node", icon: <Crop className="h-4 w-4" /> },
    { kind: "extractFrameFromVideo", label: "Extract Frame from Video Node", icon: <Film className="h-4 w-4" /> },
];

export function LeftSidebar({ onAddNode, onLoadSampleWorkflow, collapsed, onToggleCollapse, authenticated }: LeftSidebarProps) {
    const router = useRouter();
    const { userId } = useAuth();
    const { user } = useUser();
    const displayName = user?.fullName || user?.username || user?.firstName || "Account";
    const onDragStart = (event: React.DragEvent<HTMLButtonElement>, kind: WorkflowNodeKind) => {
        event.dataTransfer.setData("application/nextflow-node-kind", kind);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside
            className={`krea-scroll border-r border-white/6 bg-[#06070b] py-4 transition-[width,padding] duration-300 flex flex-col justify-between ${collapsed ? "w-18.5 px-2" : "w-67.5 px-3"
                }`}
        >

            <div>
                <div className="mb-6 px-2">
                    <button
                        onClick={onToggleCollapse}
                        className="rounded-lg border border-white/10 bg-[#15161a] p-2 text-zinc-400"
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>
                </div>

                <div className="mb-4 space-y-1 px-1">
                    <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-100 transition-colors hover:bg-white/10">
                        <Home className="h-4 w-4 text-zinc-300" />
                        {!collapsed ? <span>Home</span> : null}
                    </button>
                    <button
                        onClick={onLoadSampleWorkflow}
                        disabled={!authenticated}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 disabled:opacity-40"
                        title="Load sample marketing workflow"
                    >
                        <Zap className="h-4 w-4 text-zinc-300" />
                        {!collapsed ? <span>Sample Workflow</span> : null}
                    </button>
                </div>

                {!collapsed ? (
                    <div className="mb-6 rounded-xl border border-white/10 bg-[#0f1015] px-3 py-2">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Search className="h-4 w-4" />
                            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search" readOnly value="" />
                        </div>
                    </div>
                ) : null}

                <div className="space-y-1">
                    {!collapsed ? <p className="mb-4 px-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Quick Access</p> : null}
                    {QUICK_ACCESS.map((item) => (
                        <button
                            key={item.kind}
                            onClick={() => onAddNode(item.kind)}
                            draggable={authenticated}
                            onDragStart={(event) => onDragStart(event, item.kind)}
                            disabled={!authenticated}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 disabled:opacity-40"
                        >
                            <span className="text-zinc-300">{item.icon}</span>
                            {!collapsed ? <span>{item.label}</span> : null}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-auto px-1 pt-4">
                {userId ? (
                    <div className="flex items-center gap-3 rounded-lg hover:bg-white/10 px-2 py-2">
                        <UserButton />
                        {!collapsed ? <span className="max-w-36.25 truncate text-sm font-semibold text-zinc-100">{displayName}</span> : null}
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
