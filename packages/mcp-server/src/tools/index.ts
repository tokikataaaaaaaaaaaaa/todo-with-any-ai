import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../lib/api-client.js";
import { todosList } from "./todos-list.js";
import { todosCreate } from "./todos-create.js";
import { todosUpdate } from "./todos-update.js";
import { todosDelete } from "./todos-delete.js";
import { todosToggleComplete } from "./todos-toggle-complete.js";
import { todosTree } from "./todos-tree.js";
import { projectsList } from "./projects-list.js";
import { projectsCreate } from "./projects-create.js";
import { projectsUpdate } from "./projects-update.js";
import { projectsDelete } from "./projects-delete.js";
import { sprintsList } from "./sprints-list.js";
import { sprintsCreate } from "./sprints-create.js";
import { sprintsAddTodo } from "./sprints-add-todo.js";
import type { ToolResponse } from "./types.js";

/**
 * Handle a tool call by name. Used by both MCP registration and tests.
 */
export async function handleToolCall(
  client: ApiClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  try {
    switch (toolName) {
      case "todos_list":
        return await todosList(client, args);
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
      case "sprints_create":
        return await sprintsCreate(client, args);
      case "sprints_add_todo":
        return await sprintsAddTodo(client, args);
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

/**
 * Register all MCP tools with the server.
 */
export function registerTools(server: McpServer, client: ApiClient): void {
  server.tool(
    "todos_list",
    "Todo一覧を取得します。フィルタで絞り込めます。",
    {
      completed: z.boolean().optional().describe("完了状態でフィルタ"),
      parentId: z.string().optional().describe("親TodoのIDでフィルタ。'null'でルートのみ"),
      dueBefore: z.string().optional().describe("指定日以前の締切でフィルタ（YYYY-MM-DD形式）"),
      sort: z.enum(["order", "dueDate"]).optional().describe("ソート順。'dueDate'で締切日昇順（null末尾）"),
    },
    async (args) => handleToolCall(client, "todos_list", args)
  );

  server.tool(
    "todos_create",
    "新しいTodoを作成します。",
    {
      title: z.string().describe("タイトル（必須、255文字以内）"),
      parentId: z.string().optional().describe("親TodoのID（省略でルートに作成）"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("優先度"),
      categoryIcon: z
        .enum(["work", "personal", "shopping", "health", "study", "idea"])
        .optional()
        .describe("カテゴリアイコン"),
    },
    async (args) => handleToolCall(client, "todos_create", args)
  );

  server.tool(
    "todos_update",
    "既存のTodoを更新します。",
    {
      id: z.string().describe("更新するTodoのID（必須）"),
      title: z.string().optional().describe("タイトル"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("優先度"),
      categoryIcon: z
        .enum(["work", "personal", "shopping", "health", "study", "idea"])
        .optional()
        .describe("カテゴリアイコン"),
    },
    async (args) => handleToolCall(client, "todos_update", args)
  );

  server.tool(
    "todos_delete",
    "Todoを削除します（子孫も連鎖削除）。",
    {
      id: z.string().describe("削除するTodoのID（必須）"),
    },
    async (args) => handleToolCall(client, "todos_delete", args)
  );

  server.tool(
    "todos_toggle_complete",
    "Todoの完了状態をトグルします。",
    {
      id: z.string().describe("トグルするTodoのID（必須）"),
    },
    async (args) => handleToolCall(client, "todos_toggle_complete", args)
  );

  server.tool(
    "todos_tree",
    "Todoをツリー構造で取得します。",
    {},
    async () => handleToolCall(client, "todos_tree", {})
  );

  // Project tools
  server.tool(
    "projects_list",
    "プロジェクト一覧を取得します。",
    {},
    async () => handleToolCall(client, "projects_list", {})
  );

  server.tool(
    "projects_create",
    "新しいプロジェクトを作成します。",
    {
      name: z.string().describe("プロジェクト名（必須、50文字以内）"),
      color: z.string().optional().describe("カラーコード（#RRGGBB形式）"),
      emoji: z.string().optional().describe("絵文字（2文字以内）"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
    },
    async (args) => handleToolCall(client, "projects_create", args)
  );

  server.tool(
    "projects_update",
    "既存のプロジェクトを更新します。",
    {
      id: z.string().describe("更新するプロジェクトのID（必須）"),
      name: z.string().optional().describe("プロジェクト名"),
      color: z.string().optional().describe("カラーコード（#RRGGBB形式）"),
      emoji: z.string().optional().describe("絵文字"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
    },
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

  // Sprint tools
  server.tool(
    "sprints_list",
    "スプリント一覧を取得します。",
    {},
    async () => handleToolCall(client, "sprints_list", {})
  );

  server.tool(
    "sprints_create",
    "新しいスプリントを作成します。",
    {
      name: z.string().describe("スプリント名（必須、50文字以内）"),
      startDate: z.string().describe("開始日（YYYY-MM-DD形式、必須）"),
      endDate: z.string().describe("終了日（YYYY-MM-DD形式、必須）"),
      todoIds: z.array(z.string()).optional().describe("追加するTodoのID配列"),
    },
    async (args) => handleToolCall(client, "sprints_create", args)
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
}
