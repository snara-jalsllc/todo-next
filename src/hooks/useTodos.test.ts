import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTodos } from "./useTodos";

// localStorage はjsdomが提供するが、テスト間の汚染を防ぐためクリアする
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ── ヘルパー: 初期状態にタスクを追加したhookを返す ──
function setupWithTodos() {
  const { result } = renderHook(() => useTodos());
  act(() => {
    result.current.addTodo("買い物をする", "high", "買い物", "2030-01-01");
    result.current.addTodo("本を読む", "low", "学習", "2030-06-01");
    result.current.addTodo("運動する", "medium", "健康", "");
  });
  return result;
}

// ════════════════════════════════════════
// addTodo
// ════════════════════════════════════════
describe("addTodo", () => {
  it("追加したタスクのtext/priority/category/dueが正しく保存される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("牛乳を買う", "high", "買い物", "2030-12-31");
    });
    const todo = result.current.visible[0];
    expect(todo.text).toBe("牛乳を買う");
    expect(todo.priority).toBe("high");
    expect(todo.category).toBe("買い物");
    expect(todo.due).toBe("2030-12-31");
  });

  it("追加直後のタスクはdone=falseである", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスク", "medium", "", "");
    });
    expect(result.current.visible[0].done).toBe(false);
  });

  it("追加したタスクにはユニークなidが付与される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスクA", "medium", "", "");
      result.current.addTodo("タスクB", "medium", "", "");
    });
    const ids = result.current.visible.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("複数のタスクを追加すると全て保持される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスク1", "high", "", "");
      result.current.addTodo("タスク2", "medium", "", "");
      result.current.addTodo("タスク3", "low", "", "");
    });
    expect(result.current.stats.total).toBe(3);
  });

  it("カテゴリなし・期限なしで追加できる（空文字が保存される）", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("シンプルなタスク", "medium", "", "");
    });
    const todo = result.current.visible[0];
    expect(todo.category).toBe("");
    expect(todo.due).toBe("");
  });
});

// ════════════════════════════════════════
// toggleDone
// ════════════════════════════════════════
describe("toggleDone", () => {
  it("未完了タスクをトグルするとdone=trueになる", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("タスク", "medium", "", ""));
    const id = result.current.visible[0].id;
    act(() => result.current.toggleDone(id));
    expect(result.current.visible[0].done).toBe(true);
  });

  it("完了済みタスクをトグルするとdone=falseに戻る", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("タスク", "medium", "", ""));
    const id = result.current.visible[0].id;
    act(() => result.current.toggleDone(id));
    act(() => result.current.toggleDone(id));
    expect(result.current.visible[0].done).toBe(false);
  });

  it("指定したid以外のタスクのdoneは変化しない", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスクA", "medium", "", "");
      result.current.addTodo("タスクB", "medium", "", "");
    });
    const [todoA, todoB] = result.current.visible;
    act(() => result.current.toggleDone(todoA.id));
    const updatedB = result.current.visible.find((t) => t.id === todoB.id)!;
    expect(updatedB.done).toBe(false);
  });

  it("存在しないidをトグルしてもタスクリストが壊れない", () => {
    const result = setupWithTodos();
    const before = result.current.stats.total;
    act(() => result.current.toggleDone("non-existent-id"));
    expect(result.current.stats.total).toBe(before);
  });
});

// ════════════════════════════════════════
// deleteTodo
// ════════════════════════════════════════
describe("deleteTodo", () => {
  it("指定したidのタスクが削除される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("消すタスク", "medium", "", "");
      result.current.addTodo("残すタスク", "medium", "", "");
    });
    const targetId = result.current.visible.find((t) => t.text === "消すタスク")!.id;
    act(() => result.current.deleteTodo(targetId));
    expect(result.current.visible.some((t) => t.id === targetId)).toBe(false);
  });

  it("削除後も他のタスクは残る", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("消すタスク", "medium", "", "");
      result.current.addTodo("残すタスク", "medium", "", "");
    });
    const targetId = result.current.visible.find((t) => t.text === "消すタスク")!.id;
    act(() => result.current.deleteTodo(targetId));
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].text).toBe("残すタスク");
  });

  it("全タスクを1件ずつ削除すると空になる", () => {
    const result = setupWithTodos();
    const ids = result.current.visible.map((t) => t.id);
    act(() => ids.forEach((id) => result.current.deleteTodo(id)));
    expect(result.current.stats.total).toBe(0);
  });

  it("存在しないidを削除しようとしてもタスク数は変わらない", () => {
    const result = setupWithTodos();
    const before = result.current.stats.total;
    act(() => result.current.deleteTodo("non-existent-id"));
    expect(result.current.stats.total).toBe(before);
  });
});

// ════════════════════════════════════════
// updateText
// ════════════════════════════════════════
describe("updateText", () => {
  it("指定したタスクのテキストが更新される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("旧テキスト", "medium", "", ""));
    const id = result.current.visible[0].id;
    act(() => result.current.updateText(id, "新テキスト"));
    expect(result.current.visible[0].text).toBe("新テキスト");
  });

  it("テキスト更新時に他のプロパティ（priority等）は変化しない", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("タスク", "high", "仕事", "2030-01-01"));
    const id = result.current.visible[0].id;
    act(() => result.current.updateText(id, "更新後"));
    const todo = result.current.visible[0];
    expect(todo.priority).toBe("high");
    expect(todo.category).toBe("仕事");
    expect(todo.due).toBe("2030-01-01");
  });

  it("指定id以外のタスクのテキストは変化しない", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスクA", "medium", "", "");
      result.current.addTodo("タスクB", "medium", "", "");
    });
    const idA = result.current.visible.find((t) => t.text === "タスクA")!.id;
    act(() => result.current.updateText(idA, "タスクA更新"));
    const todoB = result.current.visible.find((t) => t.id !== idA)!;
    expect(todoB.text).toBe("タスクB");
  });
});

// ════════════════════════════════════════
// completeAll
// ════════════════════════════════════════
describe("completeAll", () => {
  it("全タスクがdone=trueになる", () => {
    const result = setupWithTodos();
    act(() => result.current.completeAll());
    expect(result.current.visible.every((t) => t.done)).toBe(true);
  });

  it("既に完了済みのタスクもcompleteAll後もdone=trueのまま", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("タスクA", "medium", "", "");
      result.current.addTodo("タスクB", "medium", "", "");
    });
    const idA = result.current.visible[0].id;
    act(() => result.current.toggleDone(idA)); // Aを完了
    act(() => result.current.completeAll());
    expect(result.current.visible.every((t) => t.done)).toBe(true);
  });

  it("タスクが0件のときcompleteAllを呼んでもエラーにならない", () => {
    const { result } = renderHook(() => useTodos());
    expect(() => act(() => result.current.completeAll())).not.toThrow();
    expect(result.current.stats.total).toBe(0);
  });
});

// ════════════════════════════════════════
// clearDone
// ════════════════════════════════════════
describe("clearDone", () => {
  it("完了済みタスクのみ削除され、未完了タスクは残る", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("未完了タスク", "medium", "", "");
      result.current.addTodo("完了タスク", "medium", "", "");
    });
    const doneId = result.current.visible.find((t) => t.text === "完了タスク")!.id;
    act(() => result.current.toggleDone(doneId));
    act(() => result.current.clearDone());
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].text).toBe("未完了タスク");
  });

  it("全タスクが完了済みの場合、clearDone後はリストが空になる", () => {
    const result = setupWithTodos();
    act(() => result.current.completeAll());
    act(() => result.current.clearDone());
    expect(result.current.stats.total).toBe(0);
  });

  it("完了済みタスクが0件のときclearDoneを呼んでもタスク数は変わらない", () => {
    const result = setupWithTodos();
    const before = result.current.stats.total;
    act(() => result.current.clearDone());
    expect(result.current.stats.total).toBe(before);
  });
});

// ════════════════════════════════════════
// reorder
// ════════════════════════════════════════
describe("reorder", () => {
  it("fromId のタスクが toId の位置に移動し、localStorage に反映される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("A", "medium", "", "");
      result.current.addTodo("B", "medium", "", "");
      result.current.addTodo("C", "medium", "", "");
    });
    const [idA, idB, idC] = JSON.parse(localStorage.getItem("todo_next_v1")!).map(
      (t: { id: string }) => t.id
    );
    // A(index=0) を C(index=2) の位置へ移動 → B, C, A の順になる
    act(() => result.current.reorder(idA, idC));
    const stored = JSON.parse(localStorage.getItem("todo_next_v1")!);
    expect(stored[0].text).toBe("B");
    expect(stored[1].text).toBe("C");
    expect(stored[2].text).toBe("A");
  });

  it("存在しないfromIdを指定してもリストが壊れない", () => {
    const result = setupWithTodos();
    const before = result.current.visible.map((t) => t.id);
    act(() => result.current.reorder("non-existent", result.current.visible[0].id));
    expect(result.current.visible.map((t) => t.id)).toEqual(before);
  });

  it("存在しないtoIdを指定してもリストが壊れない", () => {
    const result = setupWithTodos();
    const before = result.current.visible.map((t) => t.id);
    act(() => result.current.reorder(result.current.visible[0].id, "non-existent"));
    expect(result.current.visible.map((t) => t.id)).toEqual(before);
  });
});

// ════════════════════════════════════════
// filter
// ════════════════════════════════════════
describe("filter", () => {
  it("filter=all のとき全タスクが表示される", () => {
    const result = setupWithTodos();
    const firstId = result.current.visible[0].id;
    act(() => result.current.toggleDone(firstId));
    act(() => result.current.setFilter("all"));
    expect(result.current.visible).toHaveLength(3);
  });

  it("filter=active のとき未完了タスクのみ表示される", () => {
    const result = setupWithTodos();
    const firstId = result.current.visible[0].id;
    act(() => result.current.toggleDone(firstId));
    act(() => result.current.setFilter("active"));
    expect(result.current.visible.every((t) => !t.done)).toBe(true);
    expect(result.current.visible).toHaveLength(2);
  });

  it("filter=completed のとき完了済みタスクのみ表示される", () => {
    const result = setupWithTodos();
    const firstId = result.current.visible[0].id;
    act(() => result.current.toggleDone(firstId));
    act(() => result.current.setFilter("completed"));
    expect(result.current.visible.every((t) => t.done)).toBe(true);
    expect(result.current.visible).toHaveLength(1);
  });

  it("全タスクが未完了のとき filter=completed は空を返す", () => {
    const result = setupWithTodos();
    act(() => result.current.setFilter("completed"));
    expect(result.current.visible).toHaveLength(0);
  });
});

// ════════════════════════════════════════
// search
// ════════════════════════════════════════
describe("search", () => {
  it("テキストの部分一致で絞り込まれる", () => {
    const result = setupWithTodos();
    act(() => result.current.setSearch("本を"));
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].text).toBe("本を読む");
  });

  it("検索は大文字小文字を区別しない", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("Hello World", "medium", "", ""));
    act(() => result.current.setSearch("hello"));
    expect(result.current.visible).toHaveLength(1);
  });

  it("カテゴリ名でも絞り込める", () => {
    const result = setupWithTodos();
    act(() => result.current.setSearch("学習"));
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].category).toBe("学習");
  });

  it("一致するタスクがない場合は空を返す", () => {
    const result = setupWithTodos();
    act(() => result.current.setSearch("存在しないキーワード"));
    expect(result.current.visible).toHaveLength(0);
  });

  it("検索文字列をクリアすると全タスクが再表示される", () => {
    const result = setupWithTodos();
    act(() => result.current.setSearch("本を読む"));
    act(() => result.current.setSearch(""));
    expect(result.current.visible).toHaveLength(3);
  });
});

// ════════════════════════════════════════
// sortBy
// ════════════════════════════════════════
describe("sortBy", () => {
  it("sort=priority のとき high → medium → low の順になる", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("低", "low", "", "");
      result.current.addTodo("高", "high", "", "");
      result.current.addTodo("中", "medium", "", "");
    });
    act(() => result.current.setSortBy("priority"));
    const priorities = result.current.visible.map((t) => t.priority);
    expect(priorities).toEqual(["high", "medium", "low"]);
  });

  it("sort=due のとき期限が早い順に並び、期限なしは末尾になる", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("期限なし", "medium", "", "");
      result.current.addTodo("2030年", "medium", "", "2030-06-01");
      result.current.addTodo("2025年", "medium", "", "2025-01-01");
    });
    act(() => result.current.setSortBy("due"));
    const dues = result.current.visible.map((t) => t.due);
    expect(dues[0]).toBe("2025-01-01");
    expect(dues[1]).toBe("2030-06-01");
    expect(dues[2]).toBe("");
  });

  it("sort=alpha のときテキストのアルファベット・五十音順になる", () => {
    const { result } = renderHook(() => useTodos());
    act(() => {
      result.current.addTodo("Charlie", "medium", "", "");
      result.current.addTodo("Alice", "medium", "", "");
      result.current.addTodo("Bob", "medium", "", "");
    });
    act(() => result.current.setSortBy("alpha"));
    const texts = result.current.visible.map((t) => t.text);
    expect(texts).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("sort=created のとき新しく追加したタスクが先頭になる", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTodos());
    act(() => { result.current.addTodo("最初", "medium", "", ""); });
    vi.advanceTimersByTime(10);
    act(() => { result.current.addTodo("最後", "medium", "", ""); });
    vi.useRealTimers();
    act(() => result.current.setSortBy("created"));
    expect(result.current.visible[0].text).toBe("最後");
  });
});

// ════════════════════════════════════════
// stats
// ════════════════════════════════════════
describe("stats", () => {
  it("初期状態では total=0, done=0, active=0, pct=0", () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.stats).toEqual({ total: 0, done: 0, active: 0, pct: 0 });
  });

  it("3件追加後は total=3, active=3, done=0, pct=0", () => {
    const result = setupWithTodos();
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.active).toBe(3);
    expect(result.current.stats.done).toBe(0);
    expect(result.current.stats.pct).toBe(0);
  });

  it("3件中1件完了時は done=1, active=2, pct=33", () => {
    const result = setupWithTodos();
    act(() => result.current.toggleDone(result.current.visible[0].id));
    expect(result.current.stats.done).toBe(1);
    expect(result.current.stats.active).toBe(2);
    expect(result.current.stats.pct).toBe(33);
  });

  it("全件完了時は pct=100 になる", () => {
    const result = setupWithTodos();
    act(() => result.current.completeAll());
    expect(result.current.stats.pct).toBe(100);
  });
});

// ════════════════════════════════════════
// localStorage 永続化
// ════════════════════════════════════════
describe("localStorage 永続化", () => {
  it("追加したタスクが localStorage に保存される", () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo("保存テスト", "high", "仕事", "2030-01-01"));
    const stored = JSON.parse(localStorage.getItem("todo_next_v1")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("保存テスト");
  });

  it("再マウント時に localStorage からデータが復元される", async () => {
    const { result: r1 } = renderHook(() => useTodos());
    act(() => r1.current.addTodo("復元テスト", "medium", "", ""));

    // 別インスタンスとして再マウント
    const { result: r2 } = renderHook(() => useTodos());
    // useEffect でロードされるのを待つ
    await act(async () => {});
    expect(r2.current.visible.some((t) => t.text === "復元テスト")).toBe(true);
  });

  it("localStorage が壊れた JSON を持っていてもクラッシュしない", () => {
    localStorage.setItem("todo_next_v1", "INVALID_JSON");
    expect(() => renderHook(() => useTodos())).not.toThrow();
  });
});
