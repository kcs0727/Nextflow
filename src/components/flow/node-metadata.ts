import { Clapperboard, Crop, Film, ImagePlus, Sparkles, Type, type LucideIcon } from "lucide-react";
import type { WorkflowNodeKind } from "@/types/workflow";

export type NodeTone = "orange" | "blue";

export type NodeOption = {
  kind: WorkflowNodeKind;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  handleTone: NodeTone;
};

export const NODE_OPTIONS: NodeOption[] = [
  {
    kind: "text",
    label: "Text Node",
    icon: Type,
    iconClassName: "text-orange-500 dark:text-orange-400",
    handleTone: "orange",
  },
  {
    kind: "uploadImage",
    label: "Upload Image Node",
    icon: ImagePlus,
    iconClassName: "text-blue-700 dark:text-blue-400",
    handleTone: "blue",
  },
  {
    kind: "uploadVideo",
    label: "Upload Video Node",
    icon: Clapperboard,
    iconClassName: "text-cyan-600 dark:text-cyan-400",
    handleTone: "blue",
  },
  {
    kind: "runAnyLlm",
    label: "Run Any LLM Node",
    icon: Sparkles,
    iconClassName: "text-violet-600 dark:text-violet-400",
    handleTone: "blue",
  },
  {
    kind: "cropImage",
    label: "Crop Image Node",
    icon: Crop,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    handleTone: "blue",
  },
  {
    kind: "extractFrameFromVideo",
    label: "Extract Frame from Video Node",
    icon: Film,
    iconClassName: "text-rose-600 dark:text-rose-400",
    handleTone: "blue",
  },
];

export const NODE_OPTION_MAP = Object.fromEntries(NODE_OPTIONS.map((option) => [option.kind, option] as const)) as Record<WorkflowNodeKind, NodeOption>;

export function getNodeOption(kind: WorkflowNodeKind): NodeOption {
  return NODE_OPTION_MAP[kind];
}

export function getHandleTone(kind: WorkflowNodeKind): NodeTone {
  return kind === "text" ? "orange" : "blue";
}

export const HANDLE_TONE_CLASS: Record<NodeTone, string> = {
  orange: "border-orange-200 bg-orange-500 dark:border-orange-300 dark:bg-orange-400",
  blue: "border-blue-200 bg-blue-700 dark:border-blue-300 dark:bg-blue-500",
};

export const HANDLE_TONE_STYLE: Record<NodeTone, { backgroundColor: string; borderColor: string }> = {
  orange: {
    backgroundColor: "#f97316",
    borderColor: "#fed7aa",
  },
  blue: {
    backgroundColor: "#1e3a8a",
    borderColor: "#bfdbfe",
  },
};