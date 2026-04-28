import { nanoid } from "nanoid";
import type { WorkflowNode } from "@/types/workflow";
import type { Edge } from "@xyflow/react";

export function createSampleWorkflow() {
  // Node IDs
  const uploadImageId = `node-${nanoid(8)}`;
  const uploadVideoId = `node-${nanoid(8)}`;
  const cropImageId = `node-${nanoid(8)}`;
  const extractFrameId = `node-${nanoid(8)}`;
  const textSystemPrompt1Id = `node-${nanoid(8)}`;
  const textProductDetailsId = `node-${nanoid(8)}`;
  const textSystemPrompt3Id = `node-${nanoid(8)}`;
  const llmNode1Id = `node-${nanoid(8)}`;
  const llmNode2Id = `node-${nanoid(8)}`;

  // Nodes arranged in a logical flow
  const nodes: WorkflowNode[] = [
    // Left column: Input nodes
    {
      id: uploadImageId,
      position: { x: 80, y: 80 },
      type: "uploadImage",
      data: {
        title: "Upload Image Node",
        kind: "uploadImage",
        values: { image_url: "" },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
    {
      id: uploadVideoId,
      position: { x: 80, y: 260 },
      type: "uploadVideo",
      data: {
        title: "Upload Video Node",
        kind: "uploadVideo",
        values: { video_url: "" },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },

    // Middle column: Processing nodes
    {
      id: cropImageId,
      position: { x: 340, y: 80 },
      type: "cropImage",
      data: {
        title: "Crop Image Node",
        kind: "cropImage",
        values: {
          image_url: "",
          x_percent: "10",
          y_percent: "10",
          width_percent: "80",
          height_percent: "80",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
    {
      id: extractFrameId,
      position: { x: 340, y: 260 },
      type: "extractFrameFromVideo",
      data: {
        title: "Extract Frame from Video Node",
        kind: "extractFrameFromVideo",
        values: { video_url: "", timestamp: "50%" },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },

    // Text prompt nodes
    {
      id: textSystemPrompt1Id,
      position: { x: 600, y: 40 },
      type: "text",
      data: {
        title: "Text Node - System Prompt",
        kind: "text",
        values: {
          text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
    {
      id: textProductDetailsId,
      position: { x: 600, y: 180 },
      type: "text",
      data: {
        title: "Text Node - Product Details",
        kind: "text",
        values: {
          text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
    {
      id: textSystemPrompt3Id,
      position: { x: 600, y: 320 },
      type: "text",
      data: {
        title: "Text Node - Social Media Prompt",
        kind: "text",
        values: {
          text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },

    // LLM processing nodes
    {
      id: llmNode1Id,
      position: { x: 860, y: 180 },
      type: "runAnyLlm",
      data: {
        title: "LLM Node #1 - Product Description",
        kind: "runAnyLlm",
        values: {
          model: "gemini-2.5-flash",
          system_prompt: "",
          user_message: "",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
    {
      id: llmNode2Id,
      position: { x: 1120, y: 180 },
      type: "runAnyLlm",
      data: {
        title: "LLM Node #2 - Marketing Summary",
        kind: "runAnyLlm",
        values: {
          model: "gemini-2.5-flash",
          system_prompt: "",
          user_message: "",
        },
        outputs: {},
        connectedInputs: {},
        status: "idle",
      },
    },
  ];

  // Edges connecting nodes
  const edges: Edge[] = [
    // Branch A: Image Processing
    { id: `edge-${nanoid(8)}`, source: uploadImageId, target: cropImageId, sourceHandle: null, targetHandle: "image_url" },
    { id: `edge-${nanoid(8)}`, source: textSystemPrompt1Id, target: llmNode1Id, sourceHandle: null, targetHandle: "system_prompt" },
    { id: `edge-${nanoid(8)}`, source: textProductDetailsId, target: llmNode1Id, sourceHandle: null, targetHandle: "user_message" },
    { id: `edge-${nanoid(8)}`, source: cropImageId, target: llmNode1Id, sourceHandle: null, targetHandle: "images" },

    // Branch B: Video Frame Extraction
    { id: `edge-${nanoid(8)}`, source: uploadVideoId, target: extractFrameId, sourceHandle: null, targetHandle: "video_url" },

    // Convergence: Final LLM Node
    { id: `edge-${nanoid(8)}`, source: textSystemPrompt3Id, target: llmNode2Id, sourceHandle: null, targetHandle: "system_prompt" },
    { id: `edge-${nanoid(8)}`, source: llmNode1Id, target: llmNode2Id, sourceHandle: null, targetHandle: "user_message" },
    { id: `edge-${nanoid(8)}`, source: cropImageId, target: llmNode2Id, sourceHandle: null, targetHandle: "images" },
    { id: `edge-${nanoid(8)}`, source: extractFrameId, target: llmNode2Id, sourceHandle: null, targetHandle: "images" },
  ];

  return { nodes, edges };
}
