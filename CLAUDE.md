# todo-with-any-ai Service Rules

## Git Workflow (MANDATORY)

masterブランチは保護されており、直pushは物理的にブロックされる。

**必ず以下のフローで作業すること：**

1. `git checkout -b feat/xxx` or `fix/xxx` or `chore/xxx` でブランチ作成
2. ブランチ上で実装・テスト・コミット
3. `git push -u origin <branch>` でリモートにpush
4. `gh pr create` でPR作成
5. masterへのmergeはPR経由のみ

**禁止事項：**
- `git push origin master` — 失敗する。試みないこと
- `git push --force` on master — 失敗する
- masterブランチ上での直接コミット

## Tech Stack

- Monorepo: apps/web, packages/functions, packages/mcp-server, packages/shared
- Frontend: Next.js (App Router, static export), Zustand
- Backend: Hono on Cloud Functions 2nd gen
- DB: Firestore
- MCP: @modelcontextprotocol/sdk, npm package: todo-with-any-ai-mcp

## Schema: Single Source of Truth

`packages/shared/src/schemas/` のZodスキーマが全層の定義元。

- functions: sharedのスキーマでparse()する。手動フィールド列挙禁止
- mcp-server: `npm run build` でsharedからスキーマを自動同期
- guide page: `generate-tool-defs.mjs` でスキーマからJSON自動生成

スキーマ変更時は全層のビルド・テストを実行すること。

## Build & Deploy

```bash
# Functions
cd packages/functions && node build.mjs

# Web
cd apps/web && npm run build

# MCP Server (syncs schemas from shared)
cd packages/mcp-server && npm run build

# Deploy
firebase deploy --only functions,hosting
```
