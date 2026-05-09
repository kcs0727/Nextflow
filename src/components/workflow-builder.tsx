"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { ChevronDown, Download, Hand, Maximize2, MousePointer2, MoonStar, PanelRightOpen, Play, Plus, Redo2, Save, Scissors, Share2, SunMedium, Trash2, Undo2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import toast from "react-hot-toast";
import { LeftSidebar } from "@/components/shell/left-sidebar";
import { RightSidebar } from "@/components/shell/right-sidebar";
import { nodeTypes } from "@/components/flow/node-types";
import { executeScope } from "@/lib/executor";
import { useWorkflowStore } from "@/store/workflow-store";
import { createSampleWorkflow } from "@/lib/sample-workflow";
import type { WorkflowNodeKind } from "@/types/workflow";


function WorkflowBuilderInner({ workflowId: routeWorkflowId }: { workflowId?: string }) {
    const { userId } = useAuth();
    const isAuthenticated = Boolean(userId);
    const {
        workflowId: savedWorkflowId,
        workflowName,
        nodes,
        edges,
        selectedNodeIds,
        history,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        deleteSelected,
        cutSelectedEdges,
        setWorkflowName,
        setSelectedNodeIds,
        undo,
        redo,
        loadGraph,
        setHistory,
    } = useWorkflowStore();
    const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTool, setActiveTool] = useState<"select" | "hand">("hand");
    const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [projectMenuOpen, setProjectMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const projectMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!projectMenuOpen) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target;
            if (projectMenuRef.current && target instanceof Node && !projectMenuRef.current.contains(target)) {
                setProjectMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [projectMenuOpen]);

    useEffect(() => {
        if (!routeWorkflowId) {
            if (!isAuthenticated) {
                setHistory([]);
                loadGraph([], [], undefined, "Untitled Workflow");
                return;
            }

            setHistory([]);
            loadGraph([], [], undefined, "Untitled Workflow");
            return;
        }

        if (!isAuthenticated) {
            setHistory([]);
            return;
        }

        const bootstrap = async () => {
            const wfRes = await fetch(`/api/workflows/${routeWorkflowId}`, { cache: "no-store" });
            if (wfRes.ok) {
                const wfData = await wfRes.json();
                const workflow = wfData.workflow;
                if (workflow) {
                    const graph = workflow.graphJson as { nodes: typeof nodes; edges: typeof edges };
                    loadGraph(graph.nodes ?? [], graph.edges ?? [], workflow.id, workflow.name);
                }
            }

            const runRes = await fetch(`/api/runs?workflowId=${routeWorkflowId}`, {
                cache: "no-store",
            });
            if (runRes.ok) {
                const runData = await runRes.json();
                setHistory(runData.runs ?? []);
            }
        };

        void bootstrap();
    }, [isAuthenticated, routeWorkflowId, loadGraph, setHistory]);

    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        setSelectedNodeIds((params.nodes ?? []).map((n) => n.id));
    }, [setSelectedNodeIds]);

    const saveWorkflow = useCallback(async () => {
        setActiveButtonId("save");
        setTimeout(() => setActiveButtonId(null), 300);
        try {
            const response = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: savedWorkflowId,
                    name: workflowName,
                    graph: { nodes, edges },
                }),
            });
            if (response.ok) {
                const data = await response.json();
                const workflow = data.workflow as { id: string; name: string; graphJson: { nodes: typeof nodes; edges: typeof edges } } | undefined;
                if (workflow) {
                    loadGraph(workflow.graphJson.nodes ?? [], workflow.graphJson.edges ?? [], workflow.id, workflow.name);
                }
                toast.success("Workflow saved successfully!");
            } else {
                toast.error("Failed to save workflow");
            }
        } catch (err) {
            toast.error("Error saving workflow");
            console.error(err);
        }
    }, [savedWorkflowId, workflowName, nodes, edges, loadGraph]);

    const exportWorkflow = useCallback(() => {
        setActiveButtonId("export");
        setTimeout(() => setActiveButtonId(null), 300);
        try {
            const data = {
                name: workflowName || "workflow",
                graph: { nodes, edges },
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${data.name}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Workflow exported successfully!");
        } catch (err) {
            toast.error("Error exporting workflow");
            console.error(err);
        }
    }, [workflowName, nodes, edges]);

    const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);

                    if (data.graph?.nodes && data.graph?.edges) {
                        if (data.name) {
                            setWorkflowName(data.name);
                        }
                        loadGraph(data.graph.nodes, data.graph.edges, savedWorkflowId, data.name || workflowName);
                        toast.success("Workflow imported successfully!");
                    } else {
                        throw new Error("Invalid workflow JSON format");
                    }
                } catch (err) {
                    toast.error("Invalid JSON format");
                    console.error(err);
                }
            };
            reader.readAsText(file);
        } catch (err) {
            toast.error("Error importing workflow");
            console.error(err);
        }

        // Reset file input
        event.currentTarget.value = "";
    }, [savedWorkflowId, loadGraph, setWorkflowName, workflowName]);

    const loadSampleWorkflow = useCallback(() => {
        try {
            const { nodes: sampleNodes, edges: sampleEdges } = createSampleWorkflow();
            setWorkflowName("Sample Marketing Workflow");
            loadGraph(sampleNodes, sampleEdges, savedWorkflowId, "Sample Marketing Workflow");
            toast.success("Sample workflow loaded!");
        } catch (err) {
            toast.error("Error loading sample workflow");
            console.error(err);
        }
    }, [savedWorkflowId, loadGraph, setWorkflowName]);

    const actions = useMemo(
        () => [
            {
                id: "run-full",
                label: "Run Full",
                icon: Play,
                fn: () => {
                    setActiveButtonId("run-full");
                    setTimeout(() => setActiveButtonId(null), 300);
                    executeScope("full");
                }
            },
            {
                id: "run-selected",
                label: "Run Selected",
                icon: Play,
                fn: () => {
                    setActiveButtonId("run-selected");
                    setTimeout(() => setActiveButtonId(null), 300);
                    executeScope("partial");
                }
            },
            {
                id: "run-single",
                label: "Run Single",
                icon: Play,
                fn: () => {
                    setActiveButtonId("run-single");
                    setTimeout(() => setActiveButtonId(null), 300);
                    executeScope("single");
                }
            },
            { id: "save", label: "Save", icon: Save, fn: saveWorkflow },
        ],
        [saveWorkflow],
    );

    const selectToolClass =
        activeTool === "select"
            ? "border-white/40 bg-white/18 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_10px_24px_rgba(0,0,0,0.35)]"
            : "text-zinc-300 hover:bg-[#1a1c23] hover:text-zinc-100";
    const handToolClass =
        activeTool === "hand"
            ? "border-white/40 bg-white/18 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_10px_24px_rgba(0,0,0,0.35)]"
            : "text-zinc-300 hover:bg-[#1a1c23] hover:text-zinc-100";


    return (
        <div className="flex h-[calc(100vh-1px)] w-full overflow-hidden bg-[#090a0d] text-zinc-100">
            <LeftSidebar
                onAddNode={(kind) => {
                    if (!isAuthenticated) return;
                    addNode(kind);
                }}
                onLoadSampleWorkflow={loadSampleWorkflow}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
                authenticated={isAuthenticated}
            />

            <main className="relative flex-1 bg-[#2d2d2d40]">

                <div className="pointer-events-none absolute left-4 right-4 top-4 z-30 flex items-start justify-between">
                    <div ref={projectMenuRef} className="pointer-events-auto relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#625c5c40] p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setProjectMenuOpen((value) => !value)}
                            disabled={!isAuthenticated}
                            aria-label="Open project menu"
                            className="rounded-lg p-1 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${projectMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        <input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            disabled={!isAuthenticated}
                            className="w-40 bg-transparent text-sm font-medium text-zinc-100 outline-none"
                        />
                        

                        {projectMenuOpen ? (
                            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-50 rounded-2xl border border-white/10 bg-[#625c5c40] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                                <button
                                    onClick={() => {
                                        setProjectMenuOpen(false);
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={!isAuthenticated}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/8 disabled:opacity-40"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import
                                </button>
                                <button
                                    onClick={() => {
                                        setProjectMenuOpen(false);
                                        exportWorkflow();
                                    }}
                                    disabled={!isAuthenticated}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/8 disabled:opacity-40"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="pointer-events-auto flex items-center gap-2">
                        {actions.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.fn()}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${activeButtonId === item.id
                                    ? "bg-cyan-500/40 border-cyan-500/60 text-white"
                                    : "bg-[#625c5c40] hover:border-white/20 hover:bg-[#1a1c23]"
                                    }`}
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${theme === "dark"
                                ? "border-white/10 bg-[#625c5c40] text-zinc-200 hover:border-white/20 hover:bg-[#1a1c23]"
                                : "border-zinc-300 bg-white/80 text-zinc-800 hover:border-zinc-400 hover:bg-white"
                                }`}
                            title="Toggle theme"
                        >
                            {theme === "dark" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => void (async () => {
                                try {
                                    const shareData = {
                                        title: workflowName || "NextFlow",
                                        text: `Check out ${workflowName || "this workflow"}`,
                                        url: window.location.href,
                                    };

                                    if (navigator.share) {
                                        await navigator.share(shareData);
                                    } else {
                                        await navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied to clipboard");
                                    }
                                } catch (error) {
                                    if (error instanceof DOMException && error.name === "AbortError") return;
                                    toast.error("Unable to share workflow");
                                }
                            })()}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${theme === "dark"
                                ? "border-white/10 bg-[#625c5c40] text-zinc-200 hover:border-white/20 hover:bg-[#1a1c23]"
                                : "border-zinc-300 bg-white/80 text-zinc-800 hover:border-zinc-400 hover:bg-white"
                                }`}
                            title="Share workflow"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>
                        <button
                            onClick={() => setHistoryOpen((v) => !v)}
                            className={`rounded-xl border p-2 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${theme === "dark"
                                ? "border-white/10 bg-[#625c5c40] text-zinc-200 hover:bg-[#1a1c23]"
                                : "border-zinc-300 bg-white/80 text-zinc-800 hover:bg-white"
                                }`}
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={importWorkflow}
                        className="hidden"
                    />
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={(changes) => {
                        if (!isAuthenticated) return;
                        onNodesChange(changes);
                    }}
                    onEdgesChange={(changes) => {
                        if (!isAuthenticated) return;
                        onEdgesChange(changes);
                    }}
                    onConnect={(connection) => {
                        if (!isAuthenticated) return;
                        onConnect(connection);
                    }}
                    onSelectionChange={onSelectionChange}
                    fitView
                    nodeTypes={nodeTypes}
                    proOptions={{ hideAttribution: true }}
                    selectionOnDrag={isAuthenticated && activeTool === "select"}
                    panOnDrag={isAuthenticated && activeTool === "hand"}
                    panOnScroll={isAuthenticated}
                    nodesDraggable={isAuthenticated && activeTool === "hand"}
                    nodesConnectable={isAuthenticated}
                    elementsSelectable={isAuthenticated}
                    minZoom={0.2}
                    maxZoom={2}
                    deleteKeyCode={["Delete", "Backspace"]}
                    onDragOver={(event) => {
                        if (!isAuthenticated) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                        if (!isAuthenticated) return;
                        event.preventDefault();

                        const kind = event.dataTransfer.getData("application/nextflow-node-kind") as WorkflowNodeKind;
                        if (!kind) return;

                        const position = screenToFlowPosition({
                            x: event.clientX,
                            y: event.clientY,
                        });

                        addNode(kind, position);
                    }}
                    className={`h-full w-full animate-[fadein_380ms_ease-out] ${activeTool === "select" ? "cursor-crosshair" : ""}`}
                >
                    <Background variant={BackgroundVariant.Dots} gap={22} size={1.3} color={theme === "dark" ? "#7d7d7d40" : "#a59b8640"} />
                    <Controls showInteractive={false} className="hidden!" />
                    <MiniMap
                        className="bottom-4! right-4! h-24! w-36! rounded-xl! border! border-white/10! bg-[#625c5c40]!"
                        nodeColor="#7d89a9"
                        maskColor="rgba(7,8,12,0.68)"
                        pannable
                        zoomable
                    />
                </ReactFlow>

                {nodes.length === 0 ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                        <p className="px-4 py-2 text-md tracking-wide text-zinc-400 font-semibold backdrop-blur-sm">
                            Add a node to start
                        </p>
                    </div>
                ) : null}

                <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#625c5c40] p-1 shadow-[0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <button onClick={undo} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] hover:text-zinc-100 disabled:opacity-40 relative group" title="Undo">
                        <Undo2 className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Undo
                        </span>
                    </button>
                    <button onClick={redo} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] hover:text-zinc-100 disabled:opacity-40 relative group" title="Redo">
                        <Redo2 className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Redo
                        </span>
                    </button>
                    <button onClick={deleteSelected} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] hover:text-zinc-100 disabled:opacity-40 relative group" title="Delete Selected">
                        <Trash2 className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Delete
                        </span>
                    </button>

                </div>

                <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-[#625c5c40] p-2 shadow-[0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <button
                        disabled={!isAuthenticated}
                        className="rounded-xl hover:bg-[#1a1c23] p-2 text-zinc-100 transition hover:text-zinc-100 disabled:opacity-40 relative group"
                        title="Add Node"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Add Node
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTool("select")}
                        disabled={!isAuthenticated}
                        className={`rounded-xl hover:bg-[#1a1c23] p-2 text-zinc-100 transition hover:text-zinc-100 disabled:opacity-40 relative group ${selectToolClass}`}
                        aria-pressed={activeTool === "select"}
                        title="Select Tool"
                    >
                        <MousePointer2 className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Select
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTool("hand")}
                        disabled={!isAuthenticated}
                        className={`rounded-xl hover:bg-[#1a1c23] p-2 text-zinc-100 transition hover:text-zinc-100 disabled:opacity-40 relative group ${handToolClass}`}
                        aria-pressed={activeTool === "hand"}
                        title="Hand Tool"
                    >
                        <Hand className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Hand
                        </span>
                    </button>
                    <button
                        onClick={() => cutSelectedEdges()}
                        disabled={!isAuthenticated || selectedNodeIds.length === 0}
                        className="rounded-xl hover:bg-[#1a1c23] p-2 text-zinc-300 transition hover:text-zinc-100 disabled:opacity-40 relative group"
                        title="Cut connected edges"
                    >
                        <Scissors className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Cut Edges
                        </span>
                    </button>
                    <button onClick={() => void zoomOut()} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] transition hover:text-zinc-100 disabled:opacity-40 relative group" title="Zoom Out">
                        <ZoomOut className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Zoom Out
                        </span>
                    </button>
                    <button onClick={() => void zoomIn()} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] transition hover:text-zinc-100 disabled:opacity-40 relative group" title="Zoom In">
                        <ZoomIn className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Zoom In
                        </span>
                    </button>
                    <button onClick={() => void fitView({ padding: 0.2, duration: 300 })} disabled={!isAuthenticated} className="rounded-xl p-2 text-zinc-300 hover:bg-[#1a1c23] transition hover:text-zinc-100 disabled:opacity-40 relative group" title="Fit View">
                        <Maximize2 className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Fit View
                        </span>
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090a0d]/76 backdrop-blur-[1px]">
                        <div className="rounded-2xl border border-white/12 bg-[#12141b]/95 p-6 text-center shadow-[0_16px_34px_rgba(0,0,0,0.5)]">
                            <p className="mb-3 text-sm font-semibold text-zinc-200">Authentication required to use NextFlow actions</p>
                            <SignInButton mode="modal">
                                <button className="rounded-xl border border-white/15 bg-[#1d2029] px-4 py-2 text-sm font-semibold text-zinc-100">
                                    Sign In to Continue
                                </button>
                            </SignInButton>
                        </div>
                    </div>
                ) : null}
            </main>

            {historyOpen ? <RightSidebar runs={history} workflowName={workflowName} /> : null}
        </div>
    );
}

export function WorkflowBuilder({ workflowId }: { workflowId?: string }) {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderInner workflowId={workflowId} />
        </ReactFlowProvider>
    );
}
