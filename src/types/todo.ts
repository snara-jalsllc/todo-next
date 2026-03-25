export type Priority = "high" | "medium" | "low";
export type Filter = "all" | "active" | "completed";
export type SortBy = "created" | "priority" | "due" | "alpha";

export interface Todo {
  id: string;
  text: string;
  priority: Priority;
  category: string;
  due: string;
  done: boolean;
  created: number;
}
