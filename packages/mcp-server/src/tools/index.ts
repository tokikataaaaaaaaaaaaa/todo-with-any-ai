import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../lib/api-client.js";
import { todosList } from "./todos-list.js";
import { todosCreate } from "./todos-create.js";
import { todosUpdate } from "./todos-update.js";
import { todosDelete } from "./todos-delete.js";
import { todosToggleComplete } from "./todos-toggle-complete.js";
import { todosTree } from "./todos-tree.js";
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
}
