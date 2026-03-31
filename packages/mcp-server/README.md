# todo-with-any-ai-mcp

MCP (Model Context Protocol) server for [todo-with-any-ai](https://todo-with-any-ai.web.app) — manage your todos from any AI agent.

## Setup

### 1. Get an API Key

Sign in at [todo-with-any-ai.web.app](https://todo-with-any-ai.web.app), go to **Settings** > **API Keys**, and generate a key.

### 2. Configure your AI client

#### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"],
      "env": {
        "TODO_API_URL": "https://todo-with-any-ai.web.app/api"
      }
    }
  }
}
```

#### Claude Desktop

Add to your config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"],
      "env": {
        "TODO_API_URL": "https://todo-with-any-ai.web.app/api"
      }
    }
  }
}
```

## Available Tools (19)

### Todos (8)

| Tool | Description |
|------|-------------|
| `todos_list` | Todo一覧取得（フィルタ・ソート対応） |
| `todos_get` | 単一Todo取得 |
| `todos_create` | Todo作成（プロジェクト・優先度・期限指定可） |
| `todos_update` | Todo更新 |
| `todos_delete` | Todo削除（子Todoも連動削除） |
| `todos_toggle_complete` | 完了/未完了トグル |
| `todos_tree` | ツリー構造で全Todo取得 |
| `todos_move` | Todo並び替え・親変更 |

### Projects (4)

| Tool | Description |
|------|-------------|
| `projects_list` | プロジェクト一覧 |
| `projects_create` | プロジェクト作成 |
| `projects_update` | プロジェクト更新 |
| `projects_delete` | プロジェクト削除 |

### Sprints (7)

| Tool | Description |
|------|-------------|
| `sprints_list` | スプリント一覧 |
| `sprints_get` | スプリント詳細取得 |
| `sprints_create` | スプリント作成 |
| `sprints_update` | スプリント更新 |
| `sprints_delete` | スプリント削除 |
| `sprints_add_todo` | スプリントにTodo追加 |
| `sprints_remove_todo` | スプリントからTodo削除 |

## Requirements

- Node.js >= 18

## License

MIT
