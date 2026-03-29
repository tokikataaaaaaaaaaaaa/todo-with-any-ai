# todo-with-any-ai

AIエージェントのためのTodoアプリ。人間も使える。

どのAI（Claude, ChatGPT等）からでもMCP/APIで操作できるTodoアプリ。
単なるタスク管理ではなく、AIが「自分という人間」を理解し続けるためのパーソナルデータ基盤。

## Features

- ツリー型Todo管理（カテゴリ別アイコン、優先度）
- REST API（全CRUD操作）
- MCP Server（Claude Code、Cursor等から操作）
- GitHub / Google ソーシャルログイン
- モバイルファーストSP Web

## Quick Start

### Web App

https://todo-with-any-ai.web.app

### MCP Server (Claude Code)

```bash
npx todo-with-any-ai-mcp --api-key=YOUR_API_KEY
```

**Claude Desktop設定例** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"]
    }
  }
}
```

**Claude Code設定例** (`.mcp.json`):

```json
{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"]
    }
  }
}
```

ヘルプを表示:

```bash
npx todo-with-any-ai-mcp --help
```

### REST API

Base URL: `https://todo-with-any-ai.web.app/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/keys` | APIキー一覧 |
| POST | `/api/keys` | APIキー作成 |
| GET | `/api/todos` | Todo一覧取得 |
| POST | `/api/todos` | Todo作成 |
| PUT | `/api/todos/:id` | Todo更新 |
| DELETE | `/api/todos/:id` | Todo削除 |
| PATCH | `/api/todos/:id/toggle` | 完了状態トグル |
| GET | `/api/todos/tree` | ツリー形式で取得 |

全リクエストにAPIキーが必要です:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://todo-with-any-ai.web.app/api/todos
```

## Development

### 前提条件

- Node.js >= 18
- pnpm >= 9
- Firebase CLI

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（全パッケージ）
pnpm turbo run dev

# ビルド
pnpm turbo run build

# テスト
pnpm turbo run test

# Firebase Emulator起動
firebase emulators:start
```

### プロジェクト構造

```
todo-with-any-ai/
├── apps/
│   └── web/          # Next.js フロントエンド
├── packages/
│   ├── functions/    # Firebase Cloud Functions (Hono)
│   ├── mcp-server/   # MCP Server (npm公開)
│   └── shared/       # 共有型定義
├── firebase.json
├── firestore.rules
└── turbo.json
```

## Tech Stack

- **Frontend:** Next.js (App Router) + React
- **Backend:** Hono on Firebase Cloud Functions
- **Database:** Cloud Firestore
- **Auth:** Firebase Authentication (GitHub / Google)
- **Infrastructure:** Firebase Hosting + Functions
- **Monorepo:** Turborepo + pnpm workspaces
- **MCP:** Model Context Protocol SDK

## Environment Variables

`apps/web/.env.local` に設定:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## License

MIT
