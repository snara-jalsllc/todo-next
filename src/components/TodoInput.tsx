"use client";

import { useState } from "react";
import { Priority } from "@/types/todo";

interface Props {
  onAdd: (text: string, priority: Priority, category: string, due: string) => void;
  onToast: (msg: string) => void;
}

export default function TodoInput({ onAdd, onToast }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState("");
  const [shake, setShake] = useState(false);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    onAdd(trimmed, priority, category, due);
    setText("");
    setPriority("medium");
    setCategory("");
    setDue("");
    onToast("✨ タスクを追加しました");
  }

  return (
    <div className="rounded-2xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] backdrop-blur-xl p-5 mb-6 focus-within:border-[rgba(0,245,255,0.5)] transition-colors">
      <div className="flex gap-2 mb-3">
        <input
          className={`flex-1 rounded-xl border px-4 py-3 bg-[rgba(255,255,255,0.04)] text-[#e0e0ff] placeholder-[#6060a0] outline-none text-sm transition-all
            ${shake ? "border-[rgba(255,0,110,0.6)]" : "border-[rgba(255,255,255,0.08)] focus:border-[rgba(0,245,255,0.5)] focus:shadow-[0_0_0_3px_rgba(0,245,255,0.08)]"}`}
          placeholder="新しいタスクを入力..."
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          autoComplete="off"
        />
        <button
          onClick={handleAdd}
          className="px-5 py-3 rounded-xl bg-gradient-to-br from-[#00f5ff] to-[#bf00ff] text-white font-bold text-xs tracking-wider font-[family-name:var(--font-orbitron)] shadow-[0_0_16px_rgba(0,245,255,0.25)] hover:opacity-90 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,245,255,0.4)] active:translate-y-0 transition-all whitespace-nowrap"
        >
          追加
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <select
          className="flex-1 min-w-[130px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#e0e0ff] px-3 py-2 text-xs outline-none focus:border-[rgba(0,245,255,0.4)] transition-colors cursor-pointer"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="medium">⚡ 優先度: 中</option>
          <option value="high">🔴 優先度: 高</option>
          <option value="low">🔵 優先度: 低</option>
        </select>
        <select
          className="flex-1 min-w-[130px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#e0e0ff] px-3 py-2 text-xs outline-none focus:border-[rgba(0,245,255,0.4)] transition-colors cursor-pointer"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">📁 カテゴリなし</option>
          <option value="仕事">💼 仕事</option>
          <option value="個人">👤 個人</option>
          <option value="買い物">🛒 買い物</option>
          <option value="学習">📚 学習</option>
          <option value="健康">💪 健康</option>
          <option value="その他">🔖 その他</option>
        </select>
        <input
          type="date"
          className="flex-1 min-w-[130px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#e0e0ff] px-3 py-2 text-xs outline-none focus:border-[rgba(0,245,255,0.4)] transition-colors cursor-pointer"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </div>
    </div>
  );
}
