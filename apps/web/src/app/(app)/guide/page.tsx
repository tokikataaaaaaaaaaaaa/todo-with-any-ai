import toolDefs from '@/generated/tool-definitions.json'

interface ToolParam {
  name: string
  type: string
  required: boolean
  description: string
}

interface ToolDef {
  name: string
  description: string
  category: string
  params: ToolParam[]
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'projects', label: 'Projects' },
  { key: 'sprints', label: 'Sprints' },
]

function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-3">
      <div className="mb-1 flex items-baseline gap-2">
        <code
          className="text-sm font-semibold text-[var(--accent)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {tool.name}
        </code>
        <span className="text-xs text-[var(--text-secondary)]">{tool.description}</span>
      </div>
      {tool.params.length > 0 && (
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-[var(--text-tertiary)]">
              <th className="pb-1 pr-2 font-medium">Param</th>
              <th className="pb-1 pr-2 font-medium">Type</th>
              <th className="pb-1 pr-2 font-medium">Required</th>
              <th className="pb-1 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {tool.params.map((p) => (
              <tr key={p.name} className="text-[var(--text-secondary)]">
                <td className="py-0.5 pr-2" style={{ fontFamily: 'var(--font-mono)' }}>
                  {p.name}
                </td>
                <td className="py-0.5 pr-2 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>
                  {p.type}
                </td>
                <td className="py-0.5 pr-2">
                  {p.required ? (
                    <span className="text-[var(--accent)] font-semibold">Yes</span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="py-0.5">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function GuidePage() {
  const tools = toolDefs.tools as ToolDef[]

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
          ログイン後、<a href="/settings" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>設定画面</a>の「API Keys」セクションからAPIキーを発行してください。発行されたキーは一度しか表示されないのでコピーして保管してください。
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
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"],
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
        <p className="mb-2 text-sm text-[var(--text-secondary)]">
          Claude Desktopの設定ファイルに以下を追加：
        </p>
        <p className="mb-1 text-xs text-[var(--text-tertiary)]">
          macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
        </p>
        <p className="mb-2 text-xs text-[var(--text-tertiary)]">
          Windows: %APPDATA%\Claude\claude_desktop_config.json
        </p>
        <pre
          className="mb-4 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--bg-raised)] p-4 text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
{`{
  "mcpServers": {
    "todo-with-any-ai": {
      "command": "npx",
      "args": ["-y", "todo-with-any-ai-mcp", "--api-key=YOUR_API_KEY"],
      "env": {
        "TODO_API_URL": "https://todo-with-any-ai.web.app/api"
      }
    }
  }
}`}
        </pre>

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

      {/* Available Tools — generated from tool-definitions.json */}
      <section>
        <h2
          className="mb-4 text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Available Tools ({tools.length})
        </h2>

        {CATEGORIES.map(({ key, label }) => {
          const categoryTools = tools.filter((t) => t.category === key)
          if (categoryTools.length === 0) return null
          return (
            <div key={key}>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-[var(--text)]">
                {label} ({categoryTools.length})
              </h3>
              <div className="mb-4 space-y-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
