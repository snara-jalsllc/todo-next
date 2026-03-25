"use client";

import { useState, useEffect, useCallback } from "react";
import { Todo, Priority, Filter, SortBy } from "@/types/todo";

const STORAGE_KEY = "todo_next_v1";
const PRIO_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTodos(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = useCallback(
    (text: string, priority: Priority, category: string, due: string) => {
      setTodos((prev) => [
        ...prev,
        { id: genId(), text, priority, category, due, done: false, created: Date.now() },
      ]);
    },
    []
  );

  const toggleDone = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateText = useCallback((id: string, text: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  }, []);

  const completeAll = useCallback(() => {
    setTodos((prev) => prev.map((t) => ({ ...t, done: true })));
  }, []);

  const clearDone = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done));
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    setTodos((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((t) => t.id === fromId);
      const toIdx = next.findIndex((t) => t.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  }, []);

  const visible = todos
    .filter((t) => {
      if (filter === "active" && t.done) return false;
      if (filter === "completed" && !t.done) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.text.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === "priority") return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority];
      if (sortBy === "due") {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      }
      if (sortBy === "alpha") return a.text.localeCompare(b.text, "ja");
      return b.created - a.created; // newest first
    });

  const stats = {
    total: todos.length,
    done: todos.filter((t) => t.done).length,
    active: todos.filter((t) => !t.done).length,
    pct: todos.length ? Math.round((todos.filter((t) => t.done).length / todos.length) * 100) : 0,
  };

  return {
    visible,
    stats,
    filter, setFilter,
    search, setSearch,
    sortBy, setSortBy,
    addTodo,
    toggleDone,
    deleteTodo,
    updateText,
    completeAll,
    clearDone,
    reorder,
  };
}
