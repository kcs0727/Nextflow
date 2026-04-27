"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

type InputHandleProps = {
  id: string;
  top: string;
  disabled?: boolean;
  label?: string;
};

export function InputHandle({ id, top, disabled, label }: InputHandleProps) {
  return (
    <div className="relative" style={{ position: "absolute", left: 0, top }}>
      <Handle
        type="target"
        id={id}
        position={Position.Left}
        className={cn(
          "h-3 w-3 rounded-full border border-zinc-200 bg-zinc-900",
          disabled && "opacity-50",
        )}
        isConnectable={!disabled}
      />
      {/* {label && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-zinc-400">
          {label}
        </span>
      )} */}
    </div>
  );
}

type OutputHandleProps = {
  id?: string;
  top?: string;
  label?: string;
};

export function OutputHandle({ id = "output", top = "50%", label }: OutputHandleProps) {
  return (
    <div className="relative" style={{ position: "absolute", right: 0, top }}>
      <Handle
        type="source"
        id={id}
        position={Position.Right}
        className="h-3 w-3 rounded-full border border-zinc-200 bg-zinc-900"
        isConnectable
      />
      {/* {label && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-zinc-400">
          {label}
        </span>
      )} */}
    </div>
  );
}
