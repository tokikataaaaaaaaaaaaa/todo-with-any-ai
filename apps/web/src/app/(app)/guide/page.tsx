export default function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1
        className="mb-2 text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        MCP Guide
      </h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        todo-with-any-aiは、Claude Code、Claude Desktop、Cursor等のAIエージェントから
        MCPプロトコルで直接操作できます。
      </p>

      {/* Setup */}
      <section className="mb-8">
        <h2
          className="mb-4 text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Setup
        </h2>

        <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
          1. APIキーを発行
        </h3>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          設定画面からAPIキーを発行してください。
        </p>

        <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
          2. MCP Serverを設定
        </h3>

        <h4 className="mb-1 text-sm font-medium text-[var(--text)]">
          Claude Code
        </h4>
        <p className="mb-2 text-sm text-[var(--text-secondary)]">
          Claude Codeの設定ファイル（~/.claude.json）に以下を追加：
        </p>
        <pre
          className="mb-4 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--bg-raised)] p-4 text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
{`{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"],
      "env": {
        "TODO_API_URL": "https://todo-with-any-ai.web.app/api"
      }
    }
  }
}`}
        </pre>

        <h4 className="mb-1 text-sm font-medium text-[var(--text)]">
          Claude Desktop
        </h4>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Claude Desktopの設定に同様のMCPサーバー設定を追加。
        </p>

        <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
          3. 使い方の例
        </h3>
        <ul className="mb-4 space-y-1 pl-5 text-sm text-[var(--text-secondary)]" style={{ listStyleType: 'disc' }}>
          <li>「Todoを追加して: 買い物に行く」</li>
          <li>「今日のTodo一覧を見せて」</li>
          <li>「UX見直しタスクを完了にして」</li>
          <li>「プロジェクト一覧を表示」</li>
        </ul>
      </section>

      {/* Available Tools */}
      <section>
        <h2
          className="mb-4 text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Available Tools
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">
                  Tool
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['todos_list', 'Todo一覧取得（フィルタ対応）'],
                ['todos_create', 'Todo作成'],
                ['todos_update', 'Todo更新'],
                ['todos_delete', 'Todo削除'],
                ['todos_toggle_complete', '完了トグル'],
                ['todos_tree', 'ツリー構造取得'],
                ['projects_list', 'プロジェクト一覧'],
                ['projects_create', 'プロジェクト作成'],
                ['projects_update', 'プロジェクト更新'],
                ['projects_delete', 'プロジェクト削除'],
                ['sprints_list', 'スプリント一覧'],
                ['sprints_create', 'スプリント作成'],
                ['sprints_add_todo', 'スプリントにTodo追加'],
              ].map(([tool, desc]) => (
                <tr key={tool} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    {tool}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
