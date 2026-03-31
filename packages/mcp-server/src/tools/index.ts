import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../lib/api-client.js";
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
import { urgencyLevelsList } from "./urgency-levels-list.js";
import { urgencyLevelsCreate } from "./urgency-levels-create.js";
import { urgencyLevelsUpdate } from "./urgency-levels-update.js";
import { urgencyLevelsDelete } from "./urgency-levels-delete.js";
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
      case "urgency_levels_list":
        return await urgencyLevelsList(client);
      case "urgency_levels_create":
        return await urgencyLevelsCreate(client, args);
      case "urgency_levels_update":
        return await urgencyLevelsUpdate(client, args);
      case "urgency_levels_delete":
        return await urgencyLevelsDelete(client, args);
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
      projectId: z.string().optional().describe("プロジェクトIDでフィルタ"),
    },
    async (args) => handleToolCall(client, "todos_list", args)
  );

  server.tool(
    "todos_get",
    "Todo単体を取得します。",
    {
      id: z.string().describe("取得するTodoのID（必須）"),
    },
    async (args) => handleToolCall(client, "todos_get", args)
  );

  server.tool(
    "todos_create",
    "新しいTodoを作成します。",
    {
      title: z.string().describe("タイトル（必須、255文字以内）"),
      projectId: z.string().optional().describe("プロジェクトID"),
      parentId: z.string().optional().describe("親TodoのID（省略でルートに作成）"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
      startTime: z.string().optional().describe("開始時間（HH:MM形式、dueDateが必要）"),
      endTime: z.string().optional().describe("終了時間（HH:MM形式、dueDateが必要）"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("優先度"),
      categoryIcon: z
        .enum(["work", "personal", "shopping", "health", "study", "idea"])
        .optional()
        .describe("カテゴリアイコン"),
      description: z.string().max(5000).optional().describe("メモ・詳細情報（5000文字以内）"),
      urgencyLevelId: z.string().optional().describe("緊急度レベルID"),
    },
    async (args) => handleToolCall(client, "todos_create", args)
  );

  server.tool(
    "todos_update",
    "既存のTodoを更新します。",
    {
      id: z.string().describe("更新するTodoのID（必須）"),
      title: z.string().optional().describe("タイトル"),
      projectId: z.string().optional().describe("プロジェクトID"),
      dueDate: z.string().optional().describe("締切日（YYYY-MM-DD形式）"),
      startTime: z.string().optional().describe("開始時間（HH:MM形式、dueDateが必要）"),
      endTime: z.string().optional().describe("終了時間（HH:MM形式、dueDateが必要）"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("優先度"),
      categoryIcon: z
        .enum(["work", "personal", "shopping", "health", "study", "idea"])
        .optional()
        .describe("カテゴリアイコン"),
      description: z.string().max(5000).optional().describe("メモ・詳細情報（5000文字以内）"),
      urgencyLevelId: z.string().optional().describe("緊急度レベルID"),
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
    "sprints_get",
    "スプリント詳細を取得します。",
    {
      id: z.string().describe("取得するスプリントのID（必須）"),
    },
    async (args) => handleToolCall(client, "sprints_get", args)
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
    "sprints_update",
    "既存のスプリントを更新します。",
    {
      id: z.string().describe("更新するスプリントのID（必須）"),
      name: z.string().optional().describe("スプリント名"),
      startDate: z.string().optional().describe("開始日（YYYY-MM-DD形式）"),
      endDate: z.string().optional().describe("終了日（YYYY-MM-DD形式）"),
    },
    async (args) => handleToolCall(client, "sprints_update", args)
  );

  server.tool(
    "sprints_delete",
    "スプリントを削除します。",
    {
      id: z.string().describe("削除するスプリントのID（必須）"),
    },
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

  // Urgency Level tools
  server.tool(
    "urgency_levels_list",
    "緊急度レベル一覧を取得します。",
    {},
    async () => handleToolCall(client, "urgency_levels_list", {})
  );

  server.tool(
    "urgency_levels_create",
    "新しい緊急度レベルを作成します。",
    {
      name: z.string().describe("緊急度名（必須）"),
      color: z.string().describe("カラーコード（#RRGGBB形式、必須）"),
      icon: z.string().describe("アイコン名（必須）"),
    },
    async (args) => handleToolCall(client, "urgency_levels_create", args)
  );

  server.tool(
    "urgency_levels_update",
    "既存の緊急度レベルを更新します。",
    {
      id: z.string().describe("更新する緊急度レベルのID（必須）"),
      name: z.string().optional().describe("緊急度名"),
      color: z.string().optional().describe("カラーコード（#RRGGBB形式）"),
      icon: z.string().optional().describe("アイコン名"),
    },
    async (args) => handleToolCall(client, "urgency_levels_update", args)
  );

  server.tool(
    "urgency_levels_delete",
    "緊急度レベルを削除します。",
    {
      id: z.string().describe("削除する緊急度レベルのID（必須）"),
    },
    async (args) => handleToolCall(client, "urgency_levels_delete", args)
  );
}
