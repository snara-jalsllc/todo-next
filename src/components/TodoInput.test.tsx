import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoInput from "./TodoInput";

function setup() {
  const onAdd   = vi.fn();
  const onToast = vi.fn();
  render(<TodoInput onAdd={onAdd} onToast={onToast} />);
  return { onAdd, onToast };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ════════════════════════════════════════
// レンダリング
// ════════════════════════════════════════
describe("レンダリング", () => {
  it("テキスト入力フィールドが表示される", () => {
    setup();
    expect(screen.getByPlaceholderText("新しいタスクを入力...")).toBeInTheDocument();
  });

  it("「追加」ボタンが表示される", () => {
    setup();
    expect(screen.getByRole("button", { name: "追加" })).toBeInTheDocument();
  });

  it("優先度セレクトボックスが表示される", () => {
    setup();
    expect(screen.getByDisplayValue("⚡ 優先度: 中")).toBeInTheDocument();
  });

  it("カテゴリセレクトボックスが表示される", () => {
    setup();
    expect(screen.getByDisplayValue("📁 カテゴリなし")).toBeInTheDocument();
  });

  it("期限入力フィールドが表示される", () => {
    const { container } = render(
      <TodoInput onAdd={vi.fn()} onToast={vi.fn()} />
    );
    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });
});

// ════════════════════════════════════════
// タスク追加（「追加」ボタン）
// ════════════════════════════════════════
describe("「追加」ボタンによるタスク追加", () => {
  it("テキストを入力して「追加」をクリックすると onAdd が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "牛乳を買う");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith("牛乳を買う", "medium", "", "");
  });

  it("テキスト前後の空白はtrimされてonAddに渡される", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "  タスク  ");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledWith("タスク", "medium", "", "");
  });

  it("空のテキストで「追加」をクリックしても onAdd は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("スペースのみのテキストで「追加」をクリックしても onAdd は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("タスク追加後に入力フィールドがクリアされる", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByPlaceholderText("新しいタスクを入力...");
    await user.type(input, "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(input).toHaveValue("");
  });

  it("タスク追加後に onToast が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onToast } = setup();
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onToast).toHaveBeenCalledOnce();
  });
});

// ════════════════════════════════════════
// Enterキーの無効化
// ════════════════════════════════════════
describe("Enterキー", () => {
  it("テキスト入力中に Enter を押しても onAdd は呼ばれない", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "牛乳を買う{Enter}");
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("Enter 後もテキストは入力フィールドに残ったまま", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByPlaceholderText("新しいタスクを入力...");
    await user.type(input, "テキスト{Enter}");
    expect(input).toHaveValue("テキスト");
  });
});

// ════════════════════════════════════════
// 優先度・カテゴリ・期限の選択
// ════════════════════════════════════════
describe("優先度・カテゴリ・期限の選択", () => {
  it("優先度を「高」に変更すると onAdd に 'high' が渡される", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.selectOptions(screen.getByDisplayValue("⚡ 優先度: 中"), "high");
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledWith("タスク", "high", "", "");
  });

  it("優先度を「低」に変更すると onAdd に 'low' が渡される", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.selectOptions(screen.getByDisplayValue("⚡ 優先度: 中"), "low");
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledWith("タスク", "low", "", "");
  });

  it("カテゴリを「仕事」に変更すると onAdd に '仕事' が渡される", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.selectOptions(screen.getByDisplayValue("📁 カテゴリなし"), "仕事");
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(onAdd).toHaveBeenCalledWith("タスク", "medium", "仕事", "");
  });

  it("追加後に優先度がデフォルト（medium）にリセットされる", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(screen.getByDisplayValue("⚡ 優先度: 中"), "high");
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByDisplayValue("⚡ 優先度: 中")).toBeInTheDocument();
  });

  it("追加後にカテゴリが「カテゴリなし」にリセットされる", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(screen.getByDisplayValue("📁 カテゴリなし"), "仕事");
    await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "タスク");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByDisplayValue("📁 カテゴリなし")).toBeInTheDocument();
  });
});
