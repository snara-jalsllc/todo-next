"use client";

import { useRef, useState, useEffect } from "react";
import { useTodos } from "@/hooks/useTodos";
import { Filter, SortBy } from "@/types/todo";
import TodoInput from "./TodoInput";
import TodoItem from "./TodoItem";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "completed", label: "完了" },
];

const SORTS: { value: SortBy; label: string }[] = [
  { value: "created", label: "追加順" },
  { value: "priority", label: "優先度順" },
  { value: "due", label: "期限順" },
  { value: "alpha", label: "名前順" },
];

export default function TodoApp() {
  const {
    visible, stats,
    filter, setFilter,
    search, setSearch,
    sortBy, setSortBy,
    addTodo, toggleDone, deleteTodo, updateText,
    completeAll, clearDone, reorder,
  } = useTodos();

  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragSrc = useRef<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }

  // Canvas particle background
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let W = 0, H = 0;

    function resize() {
      W = canvas!.width  = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    const COLORS = ["#00f5ff", "#bf00ff", "#ff006e"];

    class Particle {
      x = 0; y = 0; r = 0; vx = 0; vy = 0; alpha = 0; color = "";
      constructor() { this.reset(true); }
      reset(init: boolean) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 10;
        this.r = Math.random() * 1.8 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -(Math.random() * 0.4 + 0.1);
        this.alpha = Math.random() * 0.5 + 0.1;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      update() { this.x += this.vx; this.y += this.vy; if (this.y < -10) this.reset(false); }
      draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.shadowBlur = 8; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    class Star {
      x = 0; y = 0; r = 0; base = 0; t = 0; spd = 0;
      constructor() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.r = Math.random() * 1.2 + 0.2; this.base = Math.random() * 0.4 + 0.05;
        this.t = Math.random() * Math.PI * 2; this.spd = Math.random() * 0.02 + 0.005;
      }
      update() { this.t += this.spd; }
      draw() {
        ctx.save(); ctx.globalAlpha = this.base + Math.sin(this.t) * this.base * 0.8;
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    const particles = Array.from({ length: 55 }, () => new Particle());
    const stars = Array.from({ length: 120 }, () => new Star());

    function tick() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => { s.update(); s.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-[780px] mx-auto px-5 py-10 pb-20">

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-orbitron)] font-black text-4xl tracking-[0.12em] bg-gradient-to-br from-[#00f5ff] via-[#bf00ff] to-[#ff006e] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,245,255,0.4)]">
            TODO
          </h1>
          <p className="mt-2 text-[#6060a0] text-xs tracking-[0.06em]">タスクを管理する</p>
        </header>

        {/* Stats */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { label: "総タスク", value: stats.total, color: "text-[#00f5ff]" },
            { label: "未完了",  value: stats.active, color: "text-[#ffd600]" },
            { label: "完了",    value: stats.done,   color: "text-[#00ff88]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 min-w-[100px] rounded-2xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] backdrop-blur-xl px-4 py-3 text-center hover:border-[rgba(0,245,255,0.4)] transition-colors">
              <div className={`font-[family-name:var(--font-orbitron)] font-bold text-2xl leading-none ${color}`}>{value}</div>
              <div className="text-[0.7rem] text-[#6060a0] mt-1 tracking-wider uppercase">{label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-7">
          <div className="flex justify-between text-[0.75rem] text-[#6060a0] mb-1.5">
            <span>進捗</span>
            <span>{stats.pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00f5ff] to-[#bf00ff] shadow-[0_0_8px_#00f5ff] transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        {/* Input */}
        <TodoInput onAdd={addTodo} onToast={showToast} />

        {/* Filter + Search + Sort */}
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <div className="flex gap-1 rounded-xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] backdrop-blur-lg p-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all
                  ${filter === value
                    ? "bg-[linear-gradient(135deg,rgba(0,245,255,0.2),rgba(191,0,255,0.2))] text-[#00f5ff]"
                    : "text-[#6060a0] hover:text-[#e0e0ff]"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[160px] relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6060a0] text-sm pointer-events-none">🔍</span>
            <input
              className="w-full rounded-xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] backdrop-blur-lg pl-7 pr-3 py-1.5 text-xs text-[#e0e0ff] placeholder-[#6060a0] outline-none focus:border-[rgba(0,245,255,0.4)] transition-colors"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.7)] backdrop-blur-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[rgba(0,245,255,0.4)] transition-colors cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            {SORTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Bulk bar */}
        {stats.total > 0 && (
          <div className="flex gap-2 items-center mb-4 flex-wrap">
            <span className="text-xs text-[#6060a0] flex-1">{stats.total} タスク / {stats.done} 完了</span>
            <button
              onClick={() => { completeAll(); showToast("✅ 全タスクを完了しました"); }}
              className="px-3 py-1.5 rounded-xl border border-[rgba(0,245,255,0.15)] text-[#6060a0] text-xs hover:border-[#00f5ff] hover:text-[#00f5ff] hover:bg-[rgba(0,245,255,0.05)] transition-all"
            >すべて完了</button>
            <button
              onClick={() => { clearDone(); showToast("🗑️ 完了タスクを削除しました"); }}
              className="px-3 py-1.5 rounded-xl border border-[rgba(0,245,255,0.15)] text-[#6060a0] text-xs hover:border-[#ff006e] hover:text-[#ff006e] hover:bg-[rgba(255,0,110,0.05)] transition-all"
            >完了を削除</button>
          </div>
        )}

        {/* List */}
        <div className="flex flex-col gap-2.5">
          {visible.length === 0 ? (
            <div className="text-center py-16 text-[#6060a0]">
              <div className="text-5xl mb-3 opacity-40">✨</div>
              <p className="text-sm">タスクがありません。上から追加してください。</p>
            </div>
          ) : (
            visible.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleDone}
                onDelete={deleteTodo}
                onEdit={updateText}
                onDragStart={(id) => { dragSrc.current = id; }}
                onDrop={(toId) => {
                  if (dragSrc.current && dragSrc.current !== toId) {
                    reorder(dragSrc.current, toId);
                  }
                  dragSrc.current = null;
                }}
                onToast={showToast}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-[0.75rem] text-[#6060a0] tracking-wider">
        Powered by Next.js &nbsp;·&nbsp; データはブラウザに保存されます
      </footer>

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-[rgba(0,245,255,0.15)] bg-[rgba(13,13,43,0.85)] backdrop-blur-xl px-5 py-2.5 text-sm text-[#e0e0ff] whitespace-nowrap pointer-events-none transition-all duration-300
        ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {toast}
      </div>
    </>
  );
}
