export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  parentId: string | null;
  dueDate: string | null;
  priority: string | null;
  categoryIcon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoTreeNode extends Todo {
  children: TodoTreeNode[];
}
