#!/usr/bin/env node
/**
 * generate-tool-defs.mjs
 *
 * Reads compiled Zod schemas from dist/schemas/ and produces a JSON file
 * describing every MCP tool (name, description, category, params).
 *
 * Output: ../../apps/web/src/generated/tool-definitions.json
 */

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Import compiled schemas
// ---------------------------------------------------------------------------

const { createTodoSchema, updateTodoSchema } = require(
  resolve(__dirname, "../dist/schemas/todo.js")
);
const { createProjectSchema, updateProjectSchema } = require(
  resolve(__dirname, "../dist/schemas/project.js")
);
const { createSprintSchema, updateSprintSchema } = require(
  resolve(__dirname, "../dist/schemas/sprint.js")
);

// ---------------------------------------------------------------------------
// Zod v4 introspection helpers
// ---------------------------------------------------------------------------

/** Unwrap wrapper types (default, nullable, optional) and return the core type */
function unwrapDef(def) {
  if (!def) return def;
  // ZodDefault -> innerType
  if (def.type === "default" && def.innerType) {
    return unwrapDef(def.innerType._def);
  }
  // ZodNullable -> innerType
  if (def.type === "nullable" && def.innerType) {
    return unwrapDef(def.innerType._def);
  }
  // ZodOptional -> innerType
  if (def.type === "optional" && def.innerType) {
    return unwrapDef(def.innerType._def);
  }
  return def;
}

/** Get the user-facing type name for a Zod schema field */
function getTypeName(schema) {
  const core = unwrapDef(schema._def);
  if (!core) return "unknown";
  switch (core.type) {
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "enum": {
      const values = Object.values(core.entries || {});
      return values.join(" | ");
    }
    case "array":
      return "string[]";
    default:
      return core.type || "unknown";
  }
}

/** Check whether a field is required (not wrapped in optional or default) */
function isRequired(schema) {
  const t = schema._def.type;
  if (t === "optional") return false;
  if (t === "default") return false;
  // nullable alone does NOT make it optional — but if combined with default it is
  if (t === "nullable" && schema._def.innerType) {
    // nullable without default => still required at the schema level,
    // but in practice our schemas always pair nullable with .default(null),
    // which makes the outer wrapper "default". So pure nullable = required.
    return true;
  }
  return true;
}

/** Extract shape from a Zod schema, handling ZodEffects (.refine()) in v4 */
function getShape(schema) {
  const def = schema._def;
  // In Zod v4, .refine() keeps the shape on the same _def with added checks
  if (def && typeof def.shape === "object") {
    return def.shape;
  }
  // Fallback: ZodEffects wrapper (v3 style)
  if (def && "schema" in def) {
    return getShape(def.schema);
  }
  return {};
}

/** Pick fields from a schema shape and return param descriptors */
function extractParams(schema, keys, descriptions) {
  const shape = getShape(schema);
  const params = [];
  for (const key of keys) {
    const field = shape[key];
    if (!field) continue;
    params.push({
      name: key,
      type: getTypeName(field),
      required: isRequired(field),
      description: descriptions[key] || "",
    });
  }
  return params;
}

// ---------------------------------------------------------------------------
// Tool definitions — mirrors tools/index.ts registerTools exactly
// ---------------------------------------------------------------------------

const tools = [
  // --- Todos ---
  {
    name: "todos_list",
    description: "Todo一覧を取得します。フィルタで絞り込めます。",
    category: "todos",
    params: [
      { name: "completed", type: "boolean", required: false, description: "完了状態でフィルタ" },
      { name: "parentId", type: "string", required: false, description: "親TodoのIDでフィルタ。'null'でルートのみ" },
      { name: "dueBefore", type: "string", required: false, description: "指定日以前の締切でフィルタ（YYYY-MM-DD形式）" },
      { name: "sort", type: "order | dueDate", required: false, description: "ソート順。'dueDate'で締切日昇順（null末尾）" },
      { name: "projectId", type: "string", required: false, description: "プロジェクトIDでフィルタ" },
    ],
  },
  {
    name: "todos_get",
    description: "Todo単体を取得します。",
    category: "todos",
    params: [
      { name: "id", type: "string", required: true, description: "取得するTodoのID" },
    ],
  },
  {
    name: "todos_create",
    description: "新しいTodoを作成します。",
    category: "todos",
    params: extractParams(
      createTodoSchema,
      ["title", "projectId", "parentId", "dueDate", "startTime", "endTime", "priority", "categoryIcon", "description"],
      {
        title: "タイトル（255文字以内）",
        projectId: "プロジェクトID",
        parentId: "親TodoのID（省略でルートに作成）",
        dueDate: "締切日（YYYY-MM-DD形式）",
        startTime: "開始時間（HH:MM形式、dueDateが必要）",
        endTime: "終了時間（HH:MM形式、dueDateが必要）",
        priority: "優先度",
        categoryIcon: "カテゴリアイコン",
        description: "メモ・詳細情報（5000文字以内）",
      }
    ),
  },
  {
    name: "todos_update",
    description: "既存のTodoを更新します。",
    category: "todos",
    params: [
      { name: "id", type: "string", required: true, description: "更新するTodoのID" },
      ...extractParams(
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
    ],
  },
  {
    name: "todos_delete",
    description: "Todoを削除します（子孫も連鎖削除）。",
    category: "todos",
    params: [
      { name: "id", type: "string", required: true, description: "削除するTodoのID" },
    ],
  },
  {
    name: "todos_toggle_complete",
    description: "Todoの完了状態をトグルします。",
    category: "todos",
    params: [
      { name: "id", type: "string", required: true, description: "トグルするTodoのID" },
    ],
  },
  {
    name: "todos_tree",
    description: "Todoをツリー構造で取得します。",
    category: "todos",
    params: [],
  },
  {
    name: "todos_move",
    description: "Todoの順序・階層を変更します（ドラッグ&ドロップ相当）。",
    category: "todos",
    params: [
      { name: "todoId", type: "string", required: true, description: "移動するTodoのID" },
      { name: "targetId", type: "string", required: true, description: "移動先のTodoのID" },
      { name: "position", type: "child | before | after", required: true, description: "配置位置: child=子要素, before=前, after=後" },
    ],
  },

  // --- Projects ---
  {
    name: "projects_list",
    description: "プロジェクト一覧を取得します。",
    category: "projects",
    params: [],
  },
  {
    name: "projects_create",
    description: "新しいプロジェクトを作成します。",
    category: "projects",
    params: extractParams(
      createProjectSchema,
      ["name", "color", "emoji", "dueDate"],
      {
        name: "プロジェクト名（50文字以内）",
        color: "カラーコード（#RRGGBB形式）",
        emoji: "絵文字（2文字以内）",
        dueDate: "締切日（YYYY-MM-DD形式）",
      }
    ),
  },
  {
    name: "projects_update",
    description: "既存のプロジェクトを更新します。",
    category: "projects",
    params: [
      { name: "id", type: "string", required: true, description: "更新するプロジェクトのID" },
      ...extractParams(
        updateProjectSchema,
        ["name", "color", "emoji", "dueDate"],
        {
          name: "プロジェクト名",
          color: "カラーコード（#RRGGBB形式）",
          emoji: "絵文字",
          dueDate: "締切日（YYYY-MM-DD形式）",
        }
      ),
    ],
  },
  {
    name: "projects_delete",
    description: "プロジェクトを削除します。",
    category: "projects",
    params: [
      { name: "id", type: "string", required: true, description: "削除するプロジェクトのID" },
      { name: "deleteTodos", type: "boolean", required: false, description: "関連するTodoも削除するか（デフォルト: false）" },
    ],
  },

  // --- Sprints ---
  {
    name: "sprints_list",
    description: "スプリント一覧を取得します。",
    category: "sprints",
    params: [],
  },
  {
    name: "sprints_get",
    description: "スプリント詳細を取得します。",
    category: "sprints",
    params: [
      { name: "id", type: "string", required: true, description: "取得するスプリントのID" },
    ],
  },
  {
    name: "sprints_create",
    description: "新しいスプリントを作成します。",
    category: "sprints",
    params: extractParams(
      createSprintSchema,
      ["name", "startDate", "endDate", "todoIds"],
      {
        name: "スプリント名（50文字以内）",
        startDate: "開始日（YYYY-MM-DD形式）",
        endDate: "終了日（YYYY-MM-DD形式）",
        todoIds: "追加するTodoのID配列",
      }
    ),
  },
  {
    name: "sprints_update",
    description: "既存のスプリントを更新します。",
    category: "sprints",
    params: [
      { name: "id", type: "string", required: true, description: "更新するスプリントのID" },
      ...extractParams(
        updateSprintSchema,
        ["name", "startDate", "endDate"],
        {
          name: "スプリント名",
          startDate: "開始日（YYYY-MM-DD形式）",
          endDate: "終了日（YYYY-MM-DD形式）",
        }
      ),
    ],
  },
  {
    name: "sprints_delete",
    description: "スプリントを削除します。",
    category: "sprints",
    params: [
      { name: "id", type: "string", required: true, description: "削除するスプリントのID" },
    ],
  },
  {
    name: "sprints_add_todo",
    description: "スプリントにTodoを追加します。",
    category: "sprints",
    params: [
      { name: "sprintId", type: "string", required: true, description: "スプリントのID" },
      { name: "todoId", type: "string", required: true, description: "追加するTodoのID" },
    ],
  },
  {
    name: "sprints_remove_todo",
    description: "スプリントからTodoを除去します。",
    category: "sprints",
    params: [
      { name: "sprintId", type: "string", required: true, description: "スプリントのID" },
      { name: "todoId", type: "string", required: true, description: "除去するTodoのID" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outDir = resolve(__dirname, "../../../apps/web/src/generated");
mkdirSync(outDir, { recursive: true });

const outPath = resolve(outDir, "tool-definitions.json");
const output = JSON.stringify({ tools }, null, 2) + "\n";
writeFileSync(outPath, output, "utf-8");

console.log(`Wrote ${tools.length} tool definitions to ${outPath}`);
