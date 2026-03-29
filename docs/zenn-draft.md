---
title: "MCP対応ツリー型TodoアプリをFirebase + Honoで作った"
emoji: "🤖"
type: "tech"
topics: ["mcp", "firebase", "nextjs", "hono", "turborepo"]
published: false
---

# MCP対応ツリー型TodoアプリをFirebase + Honoで作った

## なぜ作ったか

Claude CodeやGitHub Copilotを日常的に使うようになると、AIとのセッションの中でTodoを管理したくなる場面が増えてくる。「さっき話していたタスクをTodoに追加して」「今週の残タスクを確認して」——こうした自然な指示を、AIが直接実行できる環境が欲しかった。

既存のTodoアプリにはいくつかの限界がある。

- **Todoistなどの有名サービス**: MCP/APIでの操作は可能だが、カスタマイズ性が低く、無料枠に制限がある
- **自作REST API型のTodo**: API-firstではあるが、MCPに最適化されていない
- **Notionなどのオールインワンツール**: MCPプラグインは存在するが、Todoとして使うには重すぎる

そこで、**AIエージェントが第一級市民として操作することを前提に設計したTodoアプリ**を作った。名前は `todo-with-any-ai`。

- URL: https://todo-with-any-ai.web.app
- GitHub: https://github.com/tokikataaaaaaaaaaaaa/todo-with-any-ai

---

## アーキテクチャ概要

### モノレポ構成（Turborepo）

```
todo-with-any-ai/
├── apps/
│   ├── web/          # Next.js (App Router) フロントエンド
│   └── functions/    # Cloud Functions (2nd gen) + Hono API
├── packages/
│   ├── mcp-server/   # MCP Server (@modelcontextprotocol/sdk)
│   └── shared/       # 型定義・ユーティリティ共有
├── turbo.json
└── pnpm-workspace.yaml
```

パッケージマネージャーはpnpm、ビルドオーケストレーションはTurborepoを使った。`packages/shared` に型定義を集約することで、フロントエンド・API・MCPサーバー間で型を共有している。

### API-first設計

設計の核心は「**UIより先にAPIを作る**」こと。全操作（CRUD、ツリー展開、完了切り替え）がREST APIとして表現されており、MCPサーバーはそのAPIを呼び出すアダプター層として機能する。

```
Claude Code
    │
    │ MCP (stdio)
    ▼
MCP Server (packages/mcp-server)
    │
    │ HTTP
    ▼
Cloud Functions + Hono (apps/functions)
    │
    │ Firestore SDK
    ▼
Firestore
```

---

## MCP Serverの実装

### なぜstdioか

MCPの通信方式にはstdioとSSEがある。Claude Codeのローカル設定（`claude_desktop_config.json`）ではstdioが最も手軽に動作する。SSEはサーバーホスティングが必要だが、stdioはnpxで即起動できる。

### ツールの定義

`@modelcontextprotocol/sdk` を使ってMCPサーバーを実装する。各Todoオペレーションを「ツール」として登録する。

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "todo-with-any-ai",
  version: "1.0.0",
});

// Todo一覧取得
server.tool(
  "list_todos",
  "Todoの一覧を取得する。parentIdを指定するとサブタスクのみ取得できる。",
  {
    parentId: z.string().optional().describe("親TodoのID（省略時はルートレベル）"),
  },
  async ({ parentId }) => {
    const todos = await fetchTodos({ parentId });
    return {
      content: [{ type: "text", text: JSON.stringify(todos, null, 2) }],
    };
  }
);

// Todo作成
server.tool(
  "create_todo",
  "新しいTodoを作成する",
  {
    title: z.string().describe("Todoのタイトル"),
    parentId: z.string().optional().describe("親TodoのID（省略時はルートレベルに作成）"),
    dueDate: z.string().optional().describe("締切日（ISO 8601形式）"),
  },
  async ({ title, parentId, dueDate }) => {
    const todo = await createTodo({ title, parentId, dueDate });
    return {
      content: [{ type: "text", text: `作成しました: ${todo.id}` }],
    };
  }
);

// 完了切り替え
server.tool(
  "toggle_todo",
  "Todoの完了状態を切り替える",
  {
    id: z.string().describe("TodoのID"),
  },
  async ({ id }) => {
    const todo = await toggleTodo(id);
    return {
      content: [{ type: "text", text: `${todo.completed ? "完了" : "未完了"}にしました` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Claude Codeへの登録

`~/.claude/claude_desktop_config.json`（または `settings.json`）に以下を追記する。

```json
{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp"],
      "env": {
        "API_BASE_URL": "https://asia-northeast1-todo-with-any-ai.cloudfunctions.net/api",
        "AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

これでClaude Codeから「今週のTodoを確認して」と言うだけで、MCPサーバーが `list_todos` を呼び出す。

---

## FirestoreでのツリーTodo設計

### parentIdによるフラットコレクション

Firestoreでツリー構造を表現する方法はいくつかある。

| 方式 | メリット | デメリット |
|------|----------|------------|
| ネストされたサブコレクション | 階層が明確 | 深い階層のクエリが複雑になる |
| adjacency list（parentId） | クエリがシンプル | 全子孫取得には複数クエリ必要 |
| materialized path | 全子孫を1クエリで取得可能 | パス更新がコスト高 |

今回は**adjacency list**（フラットコレクション + `parentId`フィールド）を選んだ。理由は以下の通り。

- Todoの階層深度は現実的に3〜4レベルまで
- クエリがシンプルで実装・デバッグが容易
- Firestoreの1ドキュメント1MBの制限を気にしなくていい

Firestoreのデータ構造：

```
todos/{todoId}
  - id: string
  - userId: string
  - title: string
  - completed: boolean
  - parentId: string | null   // ルートの場合はnull
  - dueDate: Timestamp | null
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - order: number             // 同一階層での表示順
```

### ルートレベルTodoの取得クエリ

```typescript
// ルートレベル（parentIdがnull）のTodosを取得
const rootTodos = await db
  .collection("todos")
  .where("userId", "==", userId)
  .where("parentId", "==", null)
  .orderBy("order")
  .get();

// 特定のTodoのサブタスクを取得
const subTodos = await db
  .collection("todos")
  .where("userId", "==", userId)
  .where("parentId", "==", parentId)
  .orderBy("order")
  .get();
```

---

## Firebase Auth + Hono + Cloud Functionsの認証設計

### HonoをCloud Functionsに乗せる

Cloud Functions (2nd gen) はHTTPリクエストを受け取るExpressライクな関数として動作する。ここにHonoを乗せることで、型安全なルーティングとミドルウェアを実現している。

```typescript
import { Hono } from "hono";
import { onRequest } from "firebase-functions/v2/https";

const app = new Hono();

// 認証ミドルウェア
app.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    c.set("userId", decoded.uid);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Todo CRUD
app.get("/todos", async (c) => {
  const userId = c.get("userId");
  const parentId = c.req.query("parentId") ?? null;
  // ...
});

export const api = onRequest(
  { region: "asia-northeast1" },
  (req, res) => app.fetch(req as any, res as any)
);
```

### 認証フロー

フロントエンド（Next.js）では Firebase Auth のGoogle/GitHubプロバイダーでログインし、IDトークンを取得する。このトークンをAPIリクエストの `Authorization: Bearer` ヘッダーに付与する。

MCPサーバーからのリクエストは、環境変数で渡した長期トークン（Custom Token）または事前にログイン済みの IDトークンを使う運用を想定している。

---

## デモ: Claude CodeからTodoを操作する

MCPサーバーを登録した状態で、Claude Codeに以下のように話しかけると動作する。

**ユーザー**: 「今週やるべきタスクをTodoに追加して。リリース準備、ドキュメント更新、コードレビュー、の3つ」

**Claude Code（内部動作）**:
1. `create_todo` を3回呼び出す
2. それぞれ `dueDate` を今週末に設定
3. 結果をユーザーに報告

**ユーザー**: 「リリース準備のサブタスクを作って。タグ付け、CHANGELOGの更新、デプロイ確認」

**Claude Code（内部動作）**:
1. 先ほど作成した「リリース準備」のIDを取得
2. `create_todo` を `parentId` 付きで3回呼び出す
3. ツリー構造が完成

Webアプリ（https://todo-with-any-ai.web.app）を開くと、AIが作成したツリー型のTodoが確認・編集できる。

---

## 技術スタック まとめ

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js (App Router), shadcn/ui, Tailwind CSS v4, Zustand |
| API | Cloud Functions (2nd gen), Hono |
| DB | Firestore (flat collection + parentId) |
| 認証 | Firebase Auth (Google, GitHub) |
| MCP | @modelcontextprotocol/sdk (stdio) |
| モノレポ | Turborepo, pnpm |
| ホスティング | Firebase Hosting, Cloud Functions |

---

## 今後の展望

### 段階2: Claude Agent連携

セッション中に自動でTodoを更新するAgentを提供する。作業ログを元に、「今日やったこと」を自動でTodoに記録するようなユースケースを想定している。

### 段階3: パーソナルAI基盤

タスクの完了率、時間帯ごとの生産性、カテゴリ別の傾向を蓄積することで、AIが「自分という人間」を継続的に理解できる基盤を目指す。単なるTodoアプリではなく、**自分のコンテキストをAIに与え続けるインフラ**として位置づける。

---

## おわりに

「AIが操作することを前提に設計する」という観点がプロダクト開発に加わると、設計の優先順位が変わる。UIの前にAPIを、APIの前にデータモデルを。このプロジェクトはその思想の実験台でもある。

Claude CodeやGitHub Copilotを使っている方はぜひ試してほしい。フィードバックも歓迎。

- Web: https://todo-with-any-ai.web.app
- GitHub: https://github.com/tokikataaaaaaaaaaaaa/todo-with-any-ai
