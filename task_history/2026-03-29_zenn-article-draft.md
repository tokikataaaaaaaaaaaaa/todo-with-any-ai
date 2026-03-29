# Zenn技術記事ドラフト作成

**Date**: 2026-03-29
**Owner**: Scribe (AI Agent)
**Status**: Done

---

## Task Overview

### Purpose
- todo-with-any-ai のZenn向け技術記事ドラフトを `docs/zenn-draft.md` に作成する

### Background
- プロダクトのMCP-native / API-first設計を技術記事として発信する目的
- ターゲット読者: Claude Code / GitHub Copilotのヘビーユーザー

### Scope
- In: Zennフォーマット（frontmatter付き）の記事ドラフト1本
- Out: 実際のZenn投稿、コード実装

---

## Technical Decisions

- 記事構成はPOの指定した7セクション構成に準拠
- コードスニペットはMCPサーバーの tool 定義、FirestoreクエリPatter、HonoミドルウェアをPOのスタック情報から再現
- Firestoreのツリー設計については3方式（ネストサブコレクション / adjacency list / materialized path）の比較表を挿入し、adjacency listを選んだ理由を明記
- `published: false` でdraftとして設定

---

## Problems & Fixes

- `packages/mcp-server` や `apps/` ディレクトリが未コミット状態のため、実際のソースコードは存在しなかった
  - 解決: VISION.md とPOが提供したスタック情報を元にスニペットを構成

---

## Implementation Summary

- Features:
  - Zennフロントマター付き記事ドラフト（`published: false`）
  - 全7セクション: なぜ作ったか / アーキテクチャ / MCP実装 / Firestore設計 / 認証設計 / デモ描写 / 今後の展望
  - MCPサーバーの `tool` 定義コードスニペット（list_todos / create_todo / toggle_todo）
  - Firestore adjacency list設計の比較表付き解説
  - Claude Codeとの対話デモのシナリオ描写
- Files:
  - `/Users/parker/tokikata-agent/services/todo-with-any-ai/docs/zenn-draft.md`: 記事本体
- Tests: 該当なし
- Verification:
  - Command: `cat /Users/parker/tokikata-agent/services/todo-with-any-ai/docs/zenn-draft.md`
  - Outcome: Zennフォーマットのfrontmatterと全セクションが存在することを確認済み

---

## Handoff

### TODO
- [ ] 実際のソースコードが完成したらスニペットを実コードと照合・修正
- [ ] `published: true` に変更してZennに投稿

### Known Issues
- コードスニペットはスタック仕様から構成したものであり、実装完了後に動作確認が必要

### Future Ideas
- Qiita向けにフォーマット調整した派生版の作成
- 英語版（dev.to向け）の作成
