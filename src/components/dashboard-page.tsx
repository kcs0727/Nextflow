"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Eye, FolderPlus, LayoutGrid, MoreVertical, Search, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type WorkflowCard = {
    id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    runCount?: number;
};

const TABS = ["Projects", "Apps", "Examples", "Templates"];

export function DashboardPage() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const [workflows, setWorkflows] = useState<WorkflowCard[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Projects");
    const [loading, setLoading] = useState(false);
    const [menuWorkflowId, setMenuWorkflowId] = useState<string | null>(null);
    const [renameWorkflowId, setRenameWorkflowId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");

    useEffect(() => {
        if (!isSignedIn) {
            return;
        }

        const loadWorkflows = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/workflows", { cache: "no-store" });
                if (!response.ok) {
                    setWorkflows([]);
                    return;
                }

                const data = await response.json();
                setWorkflows(
                    (data.workflows ?? []).map((workflow: { id: string; name: string; createdAt: string; updatedAt: string; _count?: { runs?: number } }) => ({
                        id: workflow.id,
                        name: workflow.name,
                        createdAt: workflow.createdAt,
                        updatedAt: workflow.updatedAt,
                        runCount: workflow._count?.runs,
                    })),
                );
            } finally {
                setLoading(false);
            }
        };

        void loadWorkflows();
    }, [isSignedIn]);

    const filteredWorkflows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return workflows.filter((workflow) => workflow.name.toLowerCase().includes(query));
    }, [search, workflows]);

    const openWorkflow = (workflowId: string) => {
        router.push(`/editor/${workflowId}`);
    };

    const createWorkflow = () => {
        router.push("/editor/new");
    };

    const beginRename = (workflow: WorkflowCard) => {
        setRenameWorkflowId(workflow.id);
        setRenameValue(workflow.name);
        setMenuWorkflowId(null);
    };

    const saveRename = async () => {
        if (!renameWorkflowId) return;

        const nextName = renameValue.trim();
        if (!nextName) return;

        const response = await fetch(`/api/workflows/${renameWorkflowId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nextName }),
        });

        if (response.ok) {
            setWorkflows((current) => current.map((workflow) => (workflow.id === renameWorkflowId ? { ...workflow, name: nextName } : workflow)));
        }

        setRenameWorkflowId(null);
        setRenameValue("");
    };

    const deleteWorkflow = async (workflowId: string) => {
        const confirmed = window.confirm("Delete this workflow? This cannot be undone.");
        if (!confirmed) return;

        const response = await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
        if (response.ok) {
            setWorkflows((current) => current.filter((workflow) => workflow.id !== workflowId));
        }

        setMenuWorkflowId(null);
    };

    return (
        <main className="min-h-screen bg-[#111111] ">

            <section className="relative border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,#121318_0%,#090a0d_100%)]">

                <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-14 pt-10 lg:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-6xl">NextFlow</h1>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 md:text-lg">
                                Build and manage visual workflows with the same dense, cinematic feel as the editor itself. Start a new workflow, reopen a saved project, or manage your dashboard cards from one place.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={createWorkflow}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    New Workflow
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                {isSignedIn ? (
                                    <button
                                        onClick={() => {
                                            setWorkflows([]);
                                            void signOut();
                                        }}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <button className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                            Sign In
                                        </button>
                                    </SignInButton>
                                )}
                            </div>
                        </div>

                        <div className="hidden w-[560px] shrink-0 xl:block">
                            <div className="relative h-[350px] rounded-[2rem] border border-white/8 bg-white/5 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                                <div className="absolute left-6 top-6 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
                                <div className="absolute right-10 top-8 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl" />
                                <div className="grid h-[280px] grid-cols-3 gap-4">
                                    <div className="translate-y-10 rounded-[1.5rem] border border-white/10 bg-zinc-200/6 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                                        <div className="mb-4 h-24 rounded-2xl bg-gradient-to-br from-zinc-500/40 to-zinc-200/10" />
                                        <div className="space-y-2 text-zinc-200/80">
                                            <div className="h-2 w-24 rounded-full bg-white/20" />
                                            <div className="h-2 w-16 rounded-full bg-white/12" />
                                        </div>
                                    </div>
                                    <div className="rounded-[1.5rem] border border-white/12 bg-zinc-900/70 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                        <div className="mb-4 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.05))]" />
                                        <div className="space-y-2 text-zinc-300/80">
                                            <div className="h-2 w-20 rounded-full bg-white/16" />
                                            <div className="h-2 w-28 rounded-full bg-white/12" />
                                        </div>
                                    </div>
                                    <div className="translate-y-8 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                                        <div className="mb-4 h-24 rounded-2xl bg-gradient-to-br from-emerald-300/30 to-cyan-400/10" />
                                        <div className="space-y-2 text-zinc-200/80">
                                            <div className="h-2 w-18 rounded-full bg-white/20" />
                                            <div className="h-2 w-14 rounded-full bg-white/12" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
                <div className="flex flex-col gap-6 border-b border-white/8 pb-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "rounded-xl px-4 py-2 text-sm transition",
                                    activeTab === tab ? "bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" : "text-white hover:bg-white/5 hover:text-zinc-200",
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-3 xl:justify-end">
                        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-zinc-400 xl:max-w-sm xl:flex-none">
                            <Search className="h-4 w-4" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                                placeholder="Search projects..."
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/8">
                            <LayoutGrid className="h-4 w-4" />
                            Last viewed
                        </button>
                        <button className="rounded-xl border border-white/10 bg-white/4 p-2 text-zinc-300 transition hover:bg-white/8">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {activeTab !== "Projects" ? (
                    <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 p-8 text-sm text-zinc-400">
                        This tab is ready for future content.
                    </div>
                ) : (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {isSignedIn ? (
                            <button
                                onClick={createWorkflow}
                                className="group flex min-h-[260px] flex-col justify-between rounded-md border border-white/8 bg-[#1b1b1b] p-4 text-left transition hover:-translate-y-1 hover:border-white/14 hover:bg-[#1e1e1e]"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="rounded-full border border-white/10 bg-white/5 p-2 text-white/90">
                                        <FolderPlus className="h-4 w-4" />
                                    </span>
                                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-black">New</span>
                                </div>
                                <div className="flex justify-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 bg-white text-2xl text-black pb-1">+</div>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-white">New Workflow</p>
                                    <p className="mt-1 text-sm text-zinc-400">Start from a blank canvas.</p>
                                </div>
                            </button>
                        ) : null}

                        {loading && isSignedIn ? (
                            <div className="col-span-full rounded-[1.75rem] border border-white/8 bg-[#12131a] p-6 text-sm text-zinc-400">Loading saved workflows...</div>
                        ) : null}

                        {isSignedIn && filteredWorkflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openWorkflow(workflow.id)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openWorkflow(workflow.id);
                                    }
                                }}
                                className="group relative flex min-h-[260px] cursor-pointer flex-col justify-between rounded-md border border-white/8 bg-[#1b1b1b] p-4 transition hover:-translate-y-1 hover:border-white/14 hover:bg-[#1e1e1e]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 to-white/5 p-3 text-zinc-200">
                                        <WandSparkles className="h-5 w-5" />
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setMenuWorkflowId((current) => (current === workflow.id ? null : workflow.id));
                                            }}
                                            className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 opacity-100 transition hover:bg-white/10 group-hover:opacity-100"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>

                                        {menuWorkflowId === workflow.id ? (
                                            <div
                                                onClick={(event) => event.stopPropagation()}
                                                className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-white/10 bg-[#0f1015] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                                            >
                                                <button
                                                    onClick={() => beginRename(workflow)}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/8"
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => deleteWorkflow(workflow.id)}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-lg font-semibold text-white">{workflow.name}</p>
                                    <p className="mt-1 text-sm text-zinc-400">Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                        <span>{workflow.runCount ?? 0} runs</span>
                                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                                        <span>Created {formatDistanceToNow(new Date(workflow.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-zinc-500">
                                    <span>Open editor</span>
                                    <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
                                </div>
                            </div>
                        ))}

                        {!loading && isSignedIn && filteredWorkflows.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-md text-zinc-400">
                                No workflows found. Create a new workflow to get started.
                            </div>
                        ) : null}

                        {!isSignedIn ? (
                            <div className="col-span-full p-8 text-center text-md text-zinc-400">
                                Sign in to view and manage saved workflows.
                            </div>
                        ) : null}
                    </div>
                )}
            </section>

            {menuWorkflowId ? (
                <button
                    aria-label="Close workflow actions menu"
                    onClick={() => setMenuWorkflowId(null)}
                    className="fixed inset-0 z-10 cursor-default bg-transparent"
                />
            ) : null}

            {renameWorkflowId ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setRenameWorkflowId(null)}>
                    <div
                        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#11131a] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-white">Rename workflow</h2>
                        <p className="mt-1 text-sm text-zinc-400">Choose a new name for this dashboard card.</p>
                        <input
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            autoFocus
                            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                            placeholder="Workflow name"
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={() => setRenameWorkflowId(null)}
                                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/8"
                            >
                                Cancel
                            </button>
                            <button onClick={() => void saveRename()} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}