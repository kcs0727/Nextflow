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
import { Plus, Play, Save, Undo2, Redo2, Trash2, Hand, MousePointer2, Scissors, PanelRightOpen, Download, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { LeftSidebar } from "@/components/shell/left-sidebar";
import { RightSidebar } from "@/components/shell/right-sidebar";
import { nodeTypes } from "@/components/flow/node-types";
import { executeScope } from "@/lib/executor";
import { useWorkflowStore } from "@/store/workflow-store";
import { createSampleWorkflow } from "@/lib/sample-workflow";
import type { WorkflowNodeKind } from "@/types/workflow";


function WorkflowBuilderInner() {
    const { userId } = useAuth();
    const isAuthenticated = Boolean(userId);
    const {
        workflowId,
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
    const { screenToFlowPosition } = useReactFlow();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTool, setActiveTool] = useState<"select" | "hand">("hand");
    const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setHistory([]);
            return;
        }

        const bootstrap = async () => {
            const wfRes = await fetch("/api/workflows", { cache: "no-store" });
            if (wfRes.ok) {
                const wfData = await wfRes.json();
                const latest = wfData.workflows?.[0];
                if (latest) {
                    const graph = latest.graphJson as { nodes: typeof nodes; edges: typeof edges };
                    loadGraph(graph.nodes ?? [], graph.edges ?? [], latest.id, latest.name);
                }
            }

            const runRes = await fetch(`/api/runs${workflowId ? `?workflowId=${workflowId}` : ""}`, {
                cache: "no-store",
            });
            if (runRes.ok) {
                const runData = await runRes.json();
                setHistory(runData.runs ?? []);
            }
        };

        void bootstrap();
    }, [isAuthenticated, workflowId, loadGraph, setHistory]);

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
                    id: workflowId,
                    name: workflowName,
                    graph: { nodes, edges },
                }),
            });
            if (response.ok) {
                toast.success("Workflow saved successfully!");
            } else {
                toast.error("Failed to save workflow");
            }
        } catch (err) {
            toast.error("Error saving workflow");
            console.error(err);
        }
    }, [workflowId, workflowName, nodes, edges]);

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
                        loadGraph(data.graph.nodes, data.graph.edges, workflowId, data.name || workflowName);
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
    }, [workflowId, loadGraph, setWorkflowName, workflowName]);

    const loadSampleWorkflow = useCallback(() => {
        try {
            const { nodes: sampleNodes, edges: sampleEdges } = createSampleWorkflow();
            setWorkflowName("Sample Marketing Workflow");
            loadGraph(sampleNodes, sampleEdges, workflowId, "Sample Marketing Workflow");
            toast.success("Sample workflow loaded!");
        } catch (err) {
            toast.error("Error loading sample workflow");
            console.error(err);
        }
    }, [workflowId, loadGraph, setWorkflowName]);

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
        <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden bg-[#090a0d] text-zinc-100">
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
                    <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-[#625c5c40] px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                        <input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            disabled={!isAuthenticated}
                            className="w-[160px] bg-transparent text-sm font-medium text-zinc-100 outline-none"
                        />
                    </div>

                    <div className="pointer-events-auto flex items-center gap-2">
                        {actions.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.fn()}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${
                                    activeButtonId === item.id
                                        ? "bg-cyan-500/40 border-cyan-500/60 text-white"
                                        : "bg-[#625c5c40] hover:border-white/20 hover:bg-[#1a1c23]"
                                }`}
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={exportWorkflow}
                            disabled={!isAuthenticated}
                            className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${
                                activeButtonId === "export"
                                    ? "bg-cyan-500/40 border-cyan-500/60 text-white"
                                    : "bg-[#625c5c40] hover:border-white/20 hover:bg-[#1a1c23]"
                            }`}
                            title="Export workflow as JSON"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!isAuthenticated}
                            className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)] backdrop-blur transition ${
                                activeButtonId === "import"
                                    ? "bg-cyan-500/40 border-cyan-500/60 text-white"
                                    : "bg-[#625c5c40] hover:border-white/20 hover:bg-[#1a1c23]"
                            }`}
                            title="Import workflow from JSON"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Import
                        </button>
                        <button
                            onClick={() => setHistoryOpen((v) => !v)}
                            className="rounded-xl border border-white/10 bg-[#625c5c40] p-2 text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.28)] hover:bg-[#1a1c23]"
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
                    <Background variant={BackgroundVariant.Dots} gap={22} size={1.3} color="#7d7d7d40" />
                    <Controls showInteractive={false} className="!hidden" />
                    <MiniMap
                        className="!bottom-4 !right-4 !h-24 !w-36 !rounded-xl !border !border-white/10 !bg-[#625c5c40]"
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
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        disabled={!isAuthenticated} 
                        className="rounded-xl bg-[#24262f] hover:bg-[#1a1c23] p-2 text-zinc-100 disabled:opacity-40 relative group" 
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
                        className={`rounded-xl bg-[#24262f] hover:bg-[#1a1c23] p-2 text-zinc-100 transition disabled:opacity-40 relative group ${selectToolClass}`}
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
                        className={`rounded-xl bg-[#24262f] hover:bg-[#1a1c23] p-2 text-zinc-100 transition disabled:opacity-40 relative group ${handToolClass}`}
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
                        className="rounded-xl border border-white/10 p-2 text-zinc-300 transition hover:bg-[#1a1c23] hover:text-zinc-100 disabled:opacity-40 relative group"
                        title="Cut connected edges"
                    >
                        <Scissors className="h-5 w-5" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                            Cut Edges
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

export function WorkflowBuilder() {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderInner />
        </ReactFlowProvider>
    );
}
