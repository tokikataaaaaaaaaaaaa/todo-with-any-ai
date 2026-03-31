import type { ApiClient } from "../lib/api-client.js";
import type { ToolResponse } from "./types.js";

export async function todosMove(
  client: ApiClient,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const todoId = args.todoId as string | undefined;
  const targetId = args.targetId as string | undefined;
  const position = args.position as string | undefined;

  if (!todoId) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: todoId is required" }],
    };
  }

  if (!targetId) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error: targetId is required" }],
    };
  }

  if (!position || !["child", "before", "after"].includes(position)) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Error: position is required and must be 'child', 'before', or 'after'",
        },
      ],
    };
  }

  if (position === "child") {
    const todo = await client.updateTodo(todoId, {
      parentId: targetId,
      order: 0,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "Todo moved as child", todo }, null, 2),
        },
      ],
    };
  }

  // For 'before' and 'after', get the target to find its parentId
  const target = await client.getTodo(targetId);
  const todo = await client.updateTodo(todoId, {
    parentId: target.parentId,
    position,
    referenceId: targetId,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message: "Todo moved", todo }, null, 2),
      },
    ],
  };
}
