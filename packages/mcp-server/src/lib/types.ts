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

export interface Project {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  order: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  todoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UrgencyLevel {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}
