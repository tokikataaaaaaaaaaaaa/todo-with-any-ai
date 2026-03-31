import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../lib/api-client.js";
import { createTodoSchema, updateTodoSchema } from "../schemas/todo.js";
import { createProjectSchema, updateProjectSchema } from "../schemas/project.js";
import { createSprintSchema, updateSprintSchema } from "../schemas/sprint.js";
import { todosList } from "./todos-list.js";
import { todosGet } from "./todos-get.js";
import { todosCreate } from "./todos-create.js";
import { todosUpdate } from "./todos-update.js";
import { todosDelete } from "./todos-delete.js";
import { todosToggleComplete } from "./todos-toggle-complete.js";
import { todosTree } from "./todos-tree.js";
import { todosMove } from "./todos-move.js";
import { projectsList } from "./projects-list.js";
import { projectsCreate } from "./projects-create.js";
import { projectsUpdate } from "./projects-update.js";
import { projectsDelete } from "./projects-delete.js";
import { sprintsList } from "./sprints-list.js";
import { sprintsGet } from "./sprints-get.js";
import { sprintsCreate } from "./sprints-create.js";
import { sprintsUpdate } from "./sprints-update.js";
import { sprintsDelete } from "./sprints-delete.js";
import { sprintsAddTodo } from "./sprints-add-todo.js";
import { sprintsRemoveTodo } from "./sprints-remove-todo.js";
import type { ToolResponse } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers to extract Zod object shapes from shared schemas.
//
// createTodoSchema has a .refine() wrapper, so we unwrap via ._def.schema
// to get the underlying ZodObject. updateTodoSchema is already a ZodObject
// (partial). For project/sprint schemas, they are plain ZodObjects.
// ---------------------------------------------------------------------------

function getShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  // Unwrap ZodEffects (created by .refine())
  if (schema._def && "schema" in schema._def) {
    return getShape((schema._def as { schema: z.ZodTypeAny }).schema);
  }
  // ZodObject
  if (schema._def && "shape" in schema._def) {
    const shapeFn = (schema._def as { shape: () => Record<string, z.ZodTypeAny> }).shape;
    return typeof shapeFn === "function" ? shapeFn() : shapeFn;
  }
  return {};
}

function pick(
  schema: z.ZodTypeAny,
  keys: string[],
  descriptions: Record<string, string>
): Record<string, z.ZodTypeAny> {
  const shape = getShape(schema);
  const result: Record<string, z.ZodTypeAny> = {};
  for (const key of keys) {
    if (shape[key]) {
      result[key] = descriptions[key]
        ? shape[key].describe(descriptions[key])
        : shape[key];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// MCP tool parameter definitions — derived from shared schemas
// ---------------------------------------------------------------------------

const todosCreateParams = pick(
  createTodoSchema,
  ["title", "projectId", "parentId", "dueDate", "startTime", "endTime", "priority", "categoryIcon", "description"],
  {
    title: "タイトル（必須、255文字以内）",
    projectId: "プロジェクトID",
    parentId: "親TodoのID（省略でルートに作成）",
    dueDate: "締切日（YYYY-MM-DD形式）",
    startTime: "開始時間（HH:MM形式、dueDateが必要）",
    endTime: "終了時間（HH:MM形式、dueDateが必要）",
    priority: "優先度",
    categoryIcon: "カテゴリアイコン",
    description: "メモ・詳細情報（5000文字以内）",
  }
);

const todosUpdateParams = {
  id: z.string().describe("更新するTodoのID（必須）"),
  ...pick(
    updateTodoSchema,
    ["title", "projectId", "dueDate", "startTime", "endTime", "priority", "categoryIcon", "description"],
    {
      title: "タイトル",
      projectId: "プロジェクトID",
      dueDate: "締切日（YYYY-MM-DD形式）",
      startTime: "開始時間（HH:MM形式、dueDateが必要）",
      endTime: "終了時間（HH:MM形式、dueDateが必要）",
      priority: "優先度",
      categoryIcon: "カテゴリアイコン",
      description: "メモ・詳細情報（5000文字以内）",
    }
  ),
};

const projectsCreateParams = pick(
  createProjectSchema,
  ["name", "color", "emoji", "dueDate"],
  {
    name: "プロジェクト名（必須、50文字以内）",
    color: "カラーコード（#RRGGBB形式）",
    emoji: "絵文字（2文字以内）",
    dueDate: "締切日（YYYY-MM-DD形式）",
  }
);

const projectsUpdateParams = {
  id: z.string().describe("更新するプロジェクトのID（必須）"),
  ...pick(
    updateProjectSchema,
    ["name", "color", "emoji", "dueDate"],
    {
      name: "プロジェクト名",
      color: "カラーコード（#RRGGBB形式）",
      emoji: "絵文字",
      dueDate: "締切日（YYYY-MM-DD形式）",
    }
  ),
};

const sprintsCreateParams = pick(
  createSprintSchema,
  ["name", "startDate", "endDate", "todoIds"],
  {
    name: "スプリント名（必須、50文字以内）",
    startDate: "開始日（YYYY-MM-DD形式、必須）",
    endDate: "終了日（YYYY-MM-DD形式、必須）",
    todoIds: "追加するTodoのID配列",
  }
);

const sprintsUpdateParams = {
  id: z.string().describe("更新するスプリントのID（必須）"),
  ...pick(
    updateSprintSchema,
    ["name", "startDate", "endDate"],
    {
      name: "スプリント名",
      startDate: "開始日（YYYY-MM-DD形式）",
      endDate: "終了日（YYYY-MM-DD形式）",
    }
  ),
};

// ---------------------------------------------------------------------------
// handleToolCall — dispatches tool calls by name
// ---------------------------------------------------------------------------

export async function handleToolCall(
  client: ApiClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  try {
    switch (toolName) {
      case "todos_list":
        return await todosList(client, args);
      case "todos_get":
        return await todosGet(client, args);
      case "todos_create":
        return await todosCreate(client, args);
      case "todos_update":
        return await todosUpdate(client, args);
      case "todos_delete":
        return await todosDelete(client, args);
      case "todos_toggle_complete":
        return await todosToggleComplete(client, args);
      case "todos_tree":
        return await todosTree(client);
      case "todos_move":
        return await todosMove(client, args);
      case "projects_list":
        return await projectsList(client);
      case "projects_create":
        return await projectsCreate(client, args);
      case "projects_update":
        return await projectsUpdate(client, args);
      case "projects_delete":
        return await projectsDelete(client, args);
      case "sprints_list":
        return await sprintsList(client);
      case "sprints_get":
        return await sprintsGet(client, args);
      case "sprints_create":
        return await sprintsCreate(client, args);
      case "sprints_update":
        return await sprintsUpdate(client, args);
      case "sprints_delete":
        return await sprintsDelete(client, args);
      case "sprints_add_todo":
        return await sprintsAddTodo(client, args);
      case "sprints_remove_todo":
        return await sprintsRemoveTodo(client, args);
      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
}

// ---------------------------------------------------------------------------
// registerTools — registers all MCP tools using shared-derived schemas
// ---------------------------------------------------------------------------

export function registerTools(server: McpServer, client: ApiClient): void {
  // --- Todos ---
  server.tool(
    "todos_list",
    "Todo一覧を取得します。フィルタで絞り込めます。",
    {
      completed: z.boolean().optional().describe("完了状態でフィルタ"),
      parentId: z.string().optional().describe("親TodoのIDでフィルタ。'null'でルートのみ"),
      dueBefore: z.string().optional().describe("指定日以前の締切でフィルタ（YYYY-MM-DD形式）"),
      sort: z.enum(["order", "dueDate"]).optional().describe("ソート順。'dueDate'で締切日昇順（null末尾）"),
      projectId: z.string().optional().describe("プロジェクトIDでフィルタ"),
    },
    async (args) => handleToolCall(client, "todos_list", args)
  );

  server.tool(
    "todos_get",
    "Todo単体を取得します。",
    { id: z.string().describe("取得するTodoのID（必須）") },
    async (args) => handleToolCall(client, "todos_get", args)
  );

  server.tool(
    "todos_create",
    "新しいTodoを作成します。",
    todosCreateParams,
    async (args) => handleToolCall(client, "todos_create", args)
  );

  server.tool(
    "todos_update",
    "既存のTodoを更新します。",
    todosUpdateParams,
    async (args) => handleToolCall(client, "todos_update", args)
  );

  server.tool(
    "todos_delete",
    "Todoを削除します（子孫も連鎖削除）。",
    { id: z.string().describe("削除するTodoのID（必須）") },
    async (args) => handleToolCall(client, "todos_delete", args)
  );

  server.tool(
    "todos_toggle_complete",
    "Todoの完了状態をトグルします。",
    { id: z.string().describe("トグルするTodoのID（必須）") },
    async (args) => handleToolCall(client, "todos_toggle_complete", args)
  );

  server.tool(
    "todos_tree",
    "Todoをツリー構造で取得します。",
    {},
    async () => handleToolCall(client, "todos_tree", {})
  );

  server.tool(
    "todos_move",
    "Todoの順序・階層を変更します（ドラッグ&ドロップ相当）。",
    {
      todoId: z.string().describe("移動するTodoのID（必須）"),
      targetId: z.string().describe("移動先のTodoのID（必須）"),
      position: z.enum(["child", "before", "after"]).describe("配置位置: 'child'=子要素, 'before'=前, 'after'=後"),
    },
    async (args) => handleToolCall(client, "todos_move", args)
  );

  // --- Projects ---
  server.tool(
    "projects_list",
    "プロジェクト一覧を取得します。",
    {},
    async () => handleToolCall(client, "projects_list", {})
  );

  server.tool(
    "projects_create",
    "新しいプロジェクトを作成します。",
    projectsCreateParams,
    async (args) => handleToolCall(client, "projects_create", args)
  );

  server.tool(
    "projects_update",
    "既存のプロジェクトを更新します。",
    projectsUpdateParams,
    async (args) => handleToolCall(client, "projects_update", args)
  );

  server.tool(
    "projects_delete",
    "プロジェクトを削除します。",
    {
      id: z.string().describe("削除するプロジェクトのID（必須）"),
      deleteTodos: z.boolean().optional().describe("関連するTodoも削除するか（デフォルト: false）"),
    },
    async (args) => handleToolCall(client, "projects_delete", args)
  );

  // --- Sprints ---
  server.tool(
    "sprints_list",
    "スプリント一覧を取得します。",
    {},
    async () => handleToolCall(client, "sprints_list", {})
  );

  server.tool(
    "sprints_get",
    "スプリント詳細を取得します。",
    { id: z.string().describe("取得するスプリントのID（必須）") },
    async (args) => handleToolCall(client, "sprints_get", args)
  );

  server.tool(
    "sprints_create",
    "新しいスプリントを作成します。",
    sprintsCreateParams,
    async (args) => handleToolCall(client, "sprints_create", args)
  );

  server.tool(
    "sprints_update",
    "既存のスプリントを更新します。",
    sprintsUpdateParams,
    async (args) => handleToolCall(client, "sprints_update", args)
  );

  server.tool(
    "sprints_delete",
    "スプリントを削除します。",
    { id: z.string().describe("削除するスプリントのID（必須）") },
    async (args) => handleToolCall(client, "sprints_delete", args)
  );

  server.tool(
    "sprints_add_todo",
    "スプリントにTodoを追加します。",
    {
      sprintId: z.string().describe("スプリントのID（必須）"),
      todoId: z.string().describe("追加するTodoのID（必須）"),
    },
    async (args) => handleToolCall(client, "sprints_add_todo", args)
  );

  server.tool(
    "sprints_remove_todo",
    "スプリントからTodoを除去します。",
    {
      sprintId: z.string().describe("スプリントのID（必須）"),
      todoId: z.string().describe("除去するTodoのID（必須）"),
    },
    async (args) => handleToolCall(client, "sprints_remove_todo", args)
  );
}
