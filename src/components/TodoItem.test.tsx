import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoItem from "./TodoItem";
import { Todo } from "@/types/todo";

// ── テスト用のデフォルトTodoオブジェクト ──
const BASE_TODO: Todo = {
  id:       "test-id-1",
  text:     "牛乳を買う",
  priority: "medium",
  category: "買い物",
  due:      "2030-06-15",
  done:     false,
  created:  1700000000000,
};

function buildTodo(overrides: Partial<Todo> = {}): Todo {
  return { ...BASE_TODO, ...overrides };
}

function setup(todo: Todo = BASE_TODO) {
  const onToggle    = vi.fn();
  const onDelete    = vi.fn();
  const onEdit      = vi.fn();
  const onDragStart = vi.fn();
  const onDrop      = vi.fn();
  const onToast     = vi.fn();
  render(
    <TodoItem
      todo={todo}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={onEdit}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onToast={onToast}
    />
  );
  return { onToggle, onDelete, onEdit, onDragStart, onDrop, onToast };
}

beforeEach(() => {
  vi.restoreAllMocks();
  // テスト日を固定して「期限超過」判定を安定させる
  vi.setSystemTime(new Date("2026-03-25"));
});

// ════════════════════════════════════════
// レンダリング
// ════════════════════════════════════════
describe("レンダリング", () => {
  it("タスクのテキストが表示される", () => {
    setup();
    expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
  });

  it("優先度バッジ「中」が表示される", () => {
    setup(buildTodo({ priority: "medium" }));
    expect(screen.getByText("中")).toBeInTheDocument();
  });

  it("優先度バッジ「高」が表示される", () => {
    setup(buildTodo({ priority: "high" }));
    expect(screen.getByText("高")).toBeInTheDocument();
  });

  it("優先度バッジ「低」が表示される", () => {
    setup(buildTodo({ priority: "low" }));
    expect(screen.getByText("低")).toBeInTheDocument();
  });

  it("カテゴリが設定されているとき、カテゴリ名が表示される", () => {
    setup(buildTodo({ category: "買い物" }));
    expect(screen.getByText("買い物")).toBeInTheDocument();
  });

  it("カテゴリが空のとき、カテゴリ名は表示されない", () => {
    setup(buildTodo({ category: "" }));
    expect(screen.queryByText("買い物")).not.toBeInTheDocument();
  });

  it("期限が設定されているとき、期限日が表示される", () => {
    setup(buildTodo({ due: "2030-06-15" }));
    expect(screen.getByText(/2030-06-15/)).toBeInTheDocument();
  });

  it("期限が空のとき、期限日は表示されない", () => {
    setup(buildTodo({ due: "" }));
    expect(screen.queryByText(/期限/)).not.toBeInTheDocument();
  });

  it("完了済みタスクのテキストに打ち消し線スタイルが適用される", () => {
    setup(buildTodo({ done: true }));
    expect(screen.getByText("牛乳を買う")).toHaveClass("line-through");
  });

  it("未完了タスクのテキストに打ち消し線スタイルが適用されない", () => {
    setup(buildTodo({ done: false }));
    expect(screen.getByText("牛乳を買う")).not.toHaveClass("line-through");
  });

  it("完了ボタン（チェックボックス）が表示される", () => {
    setup();
    expect(screen.getByRole("button", { name: "完了切り替え" })).toBeInTheDocument();
  });
});

// ════════════════════════════════════════
// 期限超過表示
// ════════════════════════════════════════
describe("期限超過", () => {
  it("期限が過去日の未完了タスクに「期限超過」が表示される", () => {
    setup(buildTodo({ due: "2020-01-01", done: false }));
    expect(screen.getByText(/期限超過/)).toBeInTheDocument();
  });

  it("期限が未来日のタスクには「期限超過」が表示されない", () => {
    setup(buildTodo({ due: "2030-12-31", done: false }));
    expect(screen.queryByText(/期限超過/)).not.toBeInTheDocument();
  });

  it("期限が過去日でも完了済みタスクには「期限超過」が表示されない", () => {
    setup(buildTodo({ due: "2020-01-01", done: true }));
    expect(screen.queryByText(/期限超過/)).not.toBeInTheDocument();
  });

  it("期限が設定されていなければ「期限超過」は表示されない", () => {
    setup(buildTodo({ due: "", done: false }));
    expect(screen.queryByText(/期限超過/)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════
// 完了トグル
// ════════════════════════════════════════
describe("完了トグル", () => {
  it("完了ボタンをクリックすると onToggle が正しい id で呼ばれる", async () => {
    const user = userEvent.setup();
    const { onToggle } = setup(buildTodo({ id: "target-id" }));
    await user.click(screen.getByRole("button", { name: "完了切り替え" }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("target-id");
  });

  it("未完了タスクをトグルすると onToast に「完了」メッセージが渡される", async () => {
    const user = userEvent.setup();
    const { onToast } = setup(buildTodo({ done: false }));
    await user.click(screen.getByRole("button", { name: "完了切り替え" }));
    expect(onToast).toHaveBeenCalledWith("✅ 完了しました");
  });

  it("完了済みタスクをトグルすると onToast に「未完了」メッセージが渡される", async () => {
    const user = userEvent.setup();
    const { onToast } = setup(buildTodo({ done: true }));
    await user.click(screen.getByRole("button", { name: "完了切り替え" }));
    expect(onToast).toHaveBeenCalledWith("↩️ 未完了に戻しました");
  });
});

// ════════════════════════════════════════
// 削除
// ════════════════════════════════════════
describe("削除", () => {
  it("削除ボタンをクリックすると onDelete が正しい id で呼ばれる", async () => {
    const user = userEvent.setup();
    const { onDelete } = setup(buildTodo({ id: "delete-target" }));
    await user.click(screen.getByTitle("削除"));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("delete-target");
  });

  it("削除ボタンをクリックすると onToast が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onToast } = setup();
    await user.click(screen.getByTitle("削除"));
    expect(onToast).toHaveBeenCalledOnce();
  });
});

// ════════════════════════════════════════
// インライン編集
// ════════════════════════════════════════
describe("インライン編集", () => {
  it("編集ボタンをクリックするとテキスト入力フィールドが現れる", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTitle("編集"));
    expect(screen.getByDisplayValue("牛乳を買う")).toBeInTheDocument();
  });

  it("編集フィールドを変更して Enter を押すと onEdit が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup(buildTodo({ id: "edit-id" }));
    await user.click(screen.getByTitle("編集"));
    const input = screen.getByDisplayValue("牛乳を買う");
    await user.clear(input);
    await user.type(input, "野菜を買う");
    await user.keyboard("{Enter}");
    expect(onEdit).toHaveBeenCalledWith("edit-id", "野菜を買う");
  });

  it("編集フィールドを変更して blur すると onEdit が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup(buildTodo({ id: "edit-id" }));
    await user.click(screen.getByTitle("編集"));
    const input = screen.getByDisplayValue("牛乳を買う");
    await user.clear(input);
    await user.type(input, "野菜を買う");
    await user.tab(); // blur
    expect(onEdit).toHaveBeenCalledWith("edit-id", "野菜を買う");
  });

  it("Escape を押すと編集がキャンセルされ onEdit は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByTitle("編集"));
    const input = screen.getByDisplayValue("牛乳を買う");
    await user.clear(input);
    await user.type(input, "変更後テキスト");
    await user.keyboard("{Escape}");
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("テキストを変更せずに Enter を押しても onEdit は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByTitle("編集"));
    await user.keyboard("{Enter}");
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("空文字列にして Enter を押しても onEdit は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByTitle("編集"));
    const input = screen.getByDisplayValue("牛乳を買う");
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("編集後に onToast が「更新」メッセージで呼ばれる", async () => {
    const user = userEvent.setup();
    const { onToast } = setup();
    await user.click(screen.getByTitle("編集"));
    const input = screen.getByDisplayValue("牛乳を買う");
    await user.clear(input);
    await user.type(input, "野菜を買う");
    await user.keyboard("{Enter}");
    expect(onToast).toHaveBeenCalledWith("✏️ タスクを更新しました");
  });
});
