"use client";

import { useRef, useState } from "react";
import { Todo } from "@/types/todo";

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onToast: (msg: string) => void;
}

const PRIO_COLOR = {
  high:   "bg-[#ff006e]",
  medium: "bg-[#ffd600]",
  low:    "bg-[#00f5ff]",
};

const PRIO_BADGE = {
  high:   "bg-[rgba(255,0,110,0.2)] text-[#ff006e] border border-[rgba(255,0,110,0.3)]",
  medium: "bg-[rgba(255,214,0,0.2)] text-[#ffd600] border border-[rgba(255,214,0,0.3)]",
  low:    "bg-[rgba(0,245,255,0.1)] text-[#00f5ff] border border-[rgba(0,245,255,0.2)]",
};

const PRIO_LABEL = { high: "高", medium: "中", low: "低" };

export default function TodoItem({
  todo, onToggle, onDelete, onEdit, onDragStart, onDrop, onToast,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(todo.text);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = todo.due && !todo.done && todo.due < today;

  function commitEdit() {
    const val = editVal.trim();
    if (val && val !== todo.text) {
      onEdit(todo.id, val);
      onToast("✏️ タスクを更新しました");
    } else {
      setEditVal(todo.text);
    }
    setEditing(false);
  }

  function startEdit() {
    setEditVal(todo.text);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(todo.id)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(todo.id); }}
      className={`group relative flex items-start gap-3 rounded-2xl border px-4 py-4 backdrop-blur-xl transition-all duration-200
        ${todo.done
          ? "opacity-50 border-[rgba(0,255,136,0.15)] bg-[rgba(13,13,43,0.7)]"
          : "border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] hover:border-[rgba(0,245,255,0.3)] hover:translate-x-0.5"
        }
        ${dragOver ? "border-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.2)]" : ""}
      `}
    >
      {/* Priority stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${PRIO_COLOR[todo.priority]}`} />

      {/* Drag handle */}
      <span className="text-[#6060a0] opacity-0 group-hover:opacity-50 transition-opacity cursor-grab mt-0.5 select-none flex-shrink-0 text-base">
        ⠿
      </span>

      {/* Checkbox */}
      <button
        onClick={() => { onToggle(todo.id); onToast(todo.done ? "↩️ 未完了に戻しました" : "✅ 完了しました"); }}
        className={`w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all
          ${todo.done ? "border-[#00ff88] bg-[#00ff88]" : "border-[#6060a0] hover:border-[#00ff88]"}`}
        aria-label="完了切り替え"
      >
        {todo.done && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="#050510" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6 4.5,9.5 10.5,2.5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full rounded-lg border border-[rgba(0,245,255,0.4)] bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[#e0e0ff] text-sm outline-none"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { setEditVal(todo.text); setEditing(false); }
            }}
          />
        ) : (
          <p className={`text-sm leading-snug break-words ${todo.done ? "line-through text-[#6060a0]" : "text-[#e0e0ff]"}`}>
            {todo.text}
          </p>
        )}
        <div className="flex gap-2 mt-1.5 flex-wrap items-center">
          <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase ${PRIO_BADGE[todo.priority]}`}>
            {PRIO_LABEL[todo.priority]}
          </span>
          {todo.category && (
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[rgba(191,0,255,0.15)] text-[#d966ff] border border-[rgba(191,0,255,0.25)] font-semibold">
              {todo.category}
            </span>
          )}
          {todo.due && (
            <span className={`text-[0.7rem] flex items-center gap-1 ${isOverdue ? "text-[#ff006e]" : "text-[#6060a0]"}`}>
              📅 {todo.due}{isOverdue && " 期限超過"}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={startEdit}
          className="w-[30px] h-[30px] rounded-lg bg-[rgba(255,255,255,0.05)] text-[#6060a0] hover:text-[#00f5ff] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-sm transition-all"
          title="編集"
        >✏️</button>
        <button
          onClick={() => { onDelete(todo.id); onToast("🗑️ タスクを削除しました"); }}
          className="w-[30px] h-[30px] rounded-lg bg-[rgba(255,255,255,0.05)] text-[#6060a0] hover:text-[#ff006e] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-sm transition-all"
          title="削除"
        >🗑️</button>
      </div>
    </div>
  );
}
