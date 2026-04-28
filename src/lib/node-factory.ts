import { nanoid } from "nanoid";
import type { WorkflowNode, WorkflowNodeData, WorkflowNodeKind } from "@/types/workflow";

const TITLES: Record<WorkflowNodeKind, string> = {
  text: "Text Node",
  uploadImage: "Upload Image Node",
  uploadVideo: "Upload Video Node",
  runAnyLlm: "Run Any LLM Node",
  cropImage: "Crop Image Node",
  extractFrameFromVideo: "Extract Frame from Video Node",
};

const DEFAULT_VALUES: Record<WorkflowNodeKind, Record<string, string>> = {
  text: { text: "" },
  uploadImage: { image_url: "" },
  uploadVideo: { video_url: "" },
  runAnyLlm: { model: "gemini-2.5-flash", system_prompt: "", user_message: "" },
  cropImage: {
    image_url: "",
    x_percent: "0",
    y_percent: "0",
    width_percent: "100",
    height_percent: "100",
  },
  extractFrameFromVideo: { video_url: "", timestamp: "0" },
};

export function createNode(kind: WorkflowNodeKind, x = 250, y = 180): WorkflowNode {
  const data: WorkflowNodeData = {
    title: TITLES[kind],
    kind,
    values: DEFAULT_VALUES[kind],
    outputs: {},
    connectedInputs: {},
    status: "idle",
  };

  return {
    id: `node-${nanoid(8)}`,
    position: { x, y },
    type: kind,
    data,
  };
}
