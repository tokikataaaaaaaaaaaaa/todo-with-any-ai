# todo-with-any-ai -- Design System & Wireframes

## UX Goal

- **Target user:** AI CLIヘビーユーザー（Claude Code / GitHub Copilot日常利用の開発者）。25-40歳、テック志向、キーボード駆動ワークフローを好む。主に日本在住。
- **Primary job-to-be-done:** AIエージェントが追加したTodoを、移動中にスマートフォンで確認・編集する。AI連携のためのAPIキーを管理する。
- **Core message:** 「AIエージェントのためのTodoアプリ。人間も使える。」

---

## 1. Brand Analysis

### Brand Personality
- **Tone:** テック・ミニマル・クリーン（Vercel / Linear / Supabase的）
- **Keywords:** AI-native, Developer-friendly, Minimal, Fast, Trust
- **Positioning:** 既存Todoアプリ（Todoist, Notion）との差別化 = MCP/API-first設計 + ツリー構造

### Target User
- **Persona:** 28歳男性エンジニア。Claude Codeを毎日使い、ターミナルで作業。スマホでは確認メインだが、外出先での簡単な編集も行う
- **Taste:** ダークモード愛好者。Vercel Dashboard, Linear, GitHubのUIに慣れ親しんでいる
- **Pain point:** 既存Todoアプリは GUI操作前提で、AIツールからの操作性が悪い

---

## 2. Design Candidates

---

### Candidate A: "Terminal Noir" -- ターミナルの延長としてのUI

**コンセプト:** ターミナルとIDEの世界観を引き継ぎ、コード文化に根ざしたデザイン。モノクロ + ボーダー中心の設計。影を使わず、ボーダーで面を区切る。ターミナルやIDEのような「道具感」が特徴。

#### Color Palette

**Light Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#18181B` | CTA、主要アクション | - |
| Primary-light | `#3F3F46` | ホバー状態 | - |
| Primary-dark | `#09090B` | アクティブ状態 | - |
| Background | `#FAFAFA` | メイン背景 | - |
| Surface | `#FFFFFF` | カード背景 | - |
| Border | `#E4E4E7` | 境界線 | - |
| Text-primary | `#18181B` | 本文 | 15.4:1 on #FAFAFA |
| Text-secondary | `#52525B` | サブテキスト | 7.1:1 on #FAFAFA |
| Text-muted | `#A1A1AA` | 補助テキスト | 3.5:1 (大テキスト用) |

**Dark Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#FAFAFA` | CTA、主要アクション | - |
| Primary-light | `#E4E4E7` | ホバー状態 | - |
| Primary-dark | `#FFFFFF` | アクティブ状態 | - |
| Background | `#09090B` | メイン背景 | - |
| Surface | `#18181B` | カード背景 | - |
| Border | `#27272A` | 境界線 | - |
| Text-primary | `#FAFAFA` | 本文 | 18.1:1 on #09090B |
| Text-secondary | `#A1A1AA` | サブテキスト | 8.6:1 on #09090B |
| Text-muted | `#71717A` | 補助テキスト | 4.7:1 on #09090B |

**Semantic Colors (Light / Dark):**

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Success | `#16A34A` | `#22C55E` | 完了状態 |
| Warning | `#CA8A04` | `#EAB308` | 注意・中優先度 |
| Error | `#DC2626` | `#EF4444` | エラー・高優先度・期限切れ |
| Info | `#2563EB` | `#3B82F6` | 情報・低優先度 |

#### Typography

| Name | Font | Size | Line Height | Weight | Usage |
|------|------|------|-------------|--------|-------|
| H1 | Inter | 24px | 1.2 | 700 | ページタイトル |
| H2 | Inter | 20px | 1.3 | 600 | セクションタイトル |
| H3 | Inter | 16px | 1.4 | 600 | カードタイトル |
| Body | Inter | 14px | 1.5 | 400 | 本文 |
| Small | Inter | 12px | 1.5 | 400 | 補助テキスト |
| Caption | Inter | 11px | 1.4 | 400 | キャプション |
| Mono | JetBrains Mono | 13px | 1.5 | 400 | APIキー、コード |

**Font Stack:**
- Sans: `'Inter', system-ui, -apple-system, sans-serif`
- Mono: `'JetBrains Mono', 'Fira Code', monospace`

#### Spacing

4px base unit（Tailwind default compatible）

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | 密なインライン要素間 |
| space-2 | 8px | 関連要素間、アイコンとテキスト |
| space-3 | 12px | フォーム要素間 |
| space-4 | 16px | カード内パディング |
| space-5 | 20px | Todo行の左右パディング |
| space-6 | 24px | セクション内要素間 |
| space-8 | 32px | セクション間 |

**ツリーインデント:** 24px/level

#### Component Styles

**Buttons:**

| Variant | Light BG | Dark BG | Border | Usage |
|---------|----------|---------|--------|-------|
| Primary | `#18181B` | `#FAFAFA` | none | 主要CTA |
| Secondary | transparent | transparent | `border-zinc-300` / `border-zinc-700` | 副次アクション |
| Ghost | transparent | transparent | none | テキストリンク風 |
| Danger | `#DC2626` | `#DC2626` | none | 削除 |

- Border Radius: `6px`（角張りすぎず丸すぎない、IDE風）
- Height: `36px`(sm), `40px`(md), `44px`(lg)
- Shadow: none
- Transition: `150ms ease-out`

**Cards / Surface:**
- Border: `1px solid` border-color
- Radius: `8px`
- Shadow: none（フラット、ボーダーのみで区別）
- Padding: `16px`

**Input:**
- Height: `40px`
- Border: `1px solid` border-color
- Radius: `6px`
- Focus ring: `2px offset-2 ring-zinc-950` (light) / `ring-zinc-50` (dark)

**Priority Badge:**
- High: `bg-red-100 text-red-700` / `bg-red-950 text-red-400`
- Medium: `bg-yellow-100 text-yellow-700` / `bg-yellow-950 text-yellow-400`
- Low: `bg-blue-100 text-blue-700` / `bg-blue-950 text-blue-400`

**Category Icons (Lucide):**
| Category | Icon | Identifier |
|----------|------|-----------|
| work | Briefcase | `work` |
| personal | User | `personal` |
| shopping | ShoppingCart | `shopping` |
| health | Heart | `health` |
| study | BookOpen | `study` |
| idea | Lightbulb | `idea` |

#### Summary
shadcn/uiのdefault themeに最も近い。実装コスト最小。安全で堅実だが、差別化は弱い。

---

### Candidate B: "Electric Indigo" -- AIの存在を感じるアクセントカラー

**コンセプト:** AIを象徴するインディゴ/バイオレットのアクセントカラーで「AIが関与するアプリ」であることを視覚的に伝える。Supabase / Vercel AI SDKのような雰囲気。

#### Color Palette

**Light Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#6366F1` | CTA、主要アクション (Indigo-500) | - |
| Primary-light | `#818CF8` | ホバー状態 | - |
| Primary-dark | `#4F46E5` | アクティブ状態 | - |
| Background | `#FAFAFA` | メイン背景 | - |
| Surface | `#FFFFFF` | カード背景 | - |
| Border | `#E5E7EB` | 境界線 | - |
| Text-primary | `#111827` | 本文 | 16.8:1 on #FAFAFA |
| Text-secondary | `#4B5563` | サブテキスト | 7.5:1 on #FAFAFA |
| Text-muted | `#9CA3AF` | 補助テキスト | 3.3:1 (大テキスト用) |

**Dark Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#818CF8` | CTA (Indigo-400) | 7.2:1 on #030712 |
| Primary-light | `#A5B4FC` | ホバー状態 | - |
| Primary-dark | `#6366F1` | アクティブ状態 | - |
| Background | `#030712` | メイン背景 (Gray-950) | - |
| Surface | `#111827` | カード背景 (Gray-900) | - |
| Border | `#1F2937` | 境界線 (Gray-800) | - |
| Text-primary | `#F9FAFB` | 本文 | 19.0:1 on #030712 |
| Text-secondary | `#9CA3AF` | サブテキスト | 8.2:1 on #030712 |
| Text-muted | `#6B7280` | 補助テキスト | 4.6:1 on #030712 |

**Semantic Colors (Light / Dark):**

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Success | `#059669` | `#34D399` | 完了状態 |
| Warning | `#D97706` | `#FBBF24` | 注意・中優先度 |
| Error | `#DC2626` | `#F87171` | エラー・高優先度・期限切れ |
| Info | `#2563EB` | `#60A5FA` | 情報・低優先度 |

#### Typography

Candidate Aと同一。
- Sans: `'Inter', system-ui, -apple-system, sans-serif`
- Mono: `'JetBrains Mono', 'Fira Code', monospace`

#### Spacing

Candidate Aと同一（4px base unit）

#### Component Styles

**Buttons:**

| Variant | Light BG | Dark BG | Border | Usage |
|---------|----------|---------|--------|-------|
| Primary | `#6366F1` text-white | `#818CF8` text-dark | none | 主要CTA |
| Secondary | `#EEF2FF` text-indigo | `#1E1B4B` text-indigo | none | 副次アクション |
| Ghost | transparent | transparent | none | テキストリンク風 |
| Danger | `#DC2626` text-white | `#DC2626` text-white | none | 削除 |

- Border Radius: `8px`（やや丸みを帯びた、モダンSaaS風）
- Height: `36px`(sm), `40px`(md), `44px`(lg)
- Transition: `150ms ease-out`

**Cards / Surface:**
- Border: `1px solid` border-color
- Radius: `12px`
- Shadow (light): `0 1px 3px rgba(0,0,0,0.06)`
- Shadow (dark): none
- Padding: `16px`

**Input:**
- Height: `40px`
- Border: `1px solid` border-color
- Radius: `8px`
- Focus ring: `2px offset-2 ring-indigo-500` / `ring-indigo-400`

**Priority Badge:**
- High: `bg-red-100 text-red-700` / `bg-red-500/20 text-red-400`
- Medium: `bg-amber-100 text-amber-700` / `bg-amber-500/20 text-amber-400`
- Low: `bg-indigo-100 text-indigo-700` / `bg-indigo-500/20 text-indigo-400`

**Category Icons:** Candidate Aと同一（Lucide icons）

#### Summary
インディゴアクセント + 軽いシャドウ。「AI」を想起させるカラーでブランドを視覚化。SaaSプロダクトとしての信頼感。ダークモード映えが最も良い。

---

### Candidate C: "Emerald Signal" -- 完了のグリーンが主役

**コンセプト:** Todoアプリの本質は「完了すること」。グリーンをPrimaryにして、タスク完了の達成感を全面に出す。GPTのブランドカラーにも近く、AIツール文脈での親和性がある。

#### Color Palette

**Light Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#059669` | CTA (Emerald-600) | 4.6:1 on white |
| Primary-light | `#10B981` | ホバー状態 | - |
| Primary-dark | `#047857` | アクティブ状態 | - |
| Background | `#FAFAFA` | メイン背景 | - |
| Surface | `#FFFFFF` | カード背景 | - |
| Border | `#E5E7EB` | 境界線 | - |
| Text-primary | `#111827` | 本文 | 16.8:1 on #FAFAFA |
| Text-secondary | `#4B5563` | サブテキスト | 7.5:1 on #FAFAFA |
| Text-muted | `#9CA3AF` | 補助テキスト | 3.3:1 (大テキスト用) |

**Dark Mode:**

| Name | Hex | Usage | Contrast |
|------|-----|-------|----------|
| Primary | `#34D399` | CTA (Emerald-400) | 11.4:1 on #030712 |
| Primary-light | `#6EE7B7` | ホバー状態 | - |
| Primary-dark | `#10B981` | アクティブ状態 | - |
| Background | `#030712` | メイン背景 | - |
| Surface | `#111827` | カード背景 | - |
| Border | `#1F2937` | 境界線 | - |
| Text-primary | `#F9FAFB` | 本文 | 19.0:1 on #030712 |
| Text-secondary | `#9CA3AF` | サブテキスト | 8.2:1 on #030712 |
| Text-muted | `#6B7280` | 補助テキスト | 4.6:1 on #030712 |

**Semantic Colors (Light / Dark):**

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Success | `#059669` | `#34D399` | 完了状態 (= Primary) |
| Warning | `#D97706` | `#FBBF24` | 注意・中優先度 |
| Error | `#DC2626` | `#F87171` | エラー・高優先度・期限切れ |
| Info | `#2563EB` | `#60A5FA` | 情報・低優先度 |

#### Typography

Candidate Aと同一。

#### Spacing

Candidate Aと同一（4px base unit）

#### Component Styles

**Buttons:**

| Variant | Light BG | Dark BG | Border | Usage |
|---------|----------|---------|--------|-------|
| Primary | `#059669` text-white | `#34D399` text-gray-900 | none | 主要CTA |
| Secondary | `#ECFDF5` text-emerald | `#064E3B` text-emerald | none | 副次アクション |
| Ghost | transparent | transparent | none | テキストリンク |
| Danger | `#DC2626` text-white | `#DC2626` text-white | none | 削除 |

- Border Radius: `8px`
- Transition: `150ms ease-out`

**Cards / Surface:**
- Border: `1px solid` border-color
- Radius: `10px`
- Shadow (light): `0 1px 2px rgba(0,0,0,0.04)`
- Shadow (dark): none
- Padding: `16px`

**Input:**
- Height: `40px`
- Border: `1px solid` border-color
- Radius: `8px`
- Focus ring: `2px offset-2 ring-emerald-600` / `ring-emerald-400`

**Priority Badge:**
- High: `bg-red-100 text-red-700` / `bg-red-500/20 text-red-400`
- Medium: `bg-amber-100 text-amber-700` / `bg-amber-500/20 text-amber-400`
- Low: `bg-blue-100 text-blue-700` / `bg-blue-500/20 text-blue-400`

**Category Icons:** Candidate Aと同一

**Unique Element - Completion Animation:**
- チェック完了時にPrimary Greenの微細なリップル (`scale 1.0 -> 1.05 -> 1.0, 200ms`)
- 完了率プログレスバーをヘッダーに表示

#### Summary
グリーン基調 + 達成感の演出。Todoアプリとしてのポジティブフィードバックが強い。ただしSuccess色とPrimary色が同一のため、完了状態の視覚的区別に注意（opacity変化 + 取り消し線で区別）。

---

## 3. Comparison Matrix

| 観点 | A: Terminal Noir | B: Electric Indigo | C: Emerald Signal |
|------|:---:|:---:|:---:|
| ブランド適合度 | 3/5 | 5/5 | 3/5 |
| 実装速度 | 5/5 | 4/5 | 4/5 |
| 差別化 | 2/5 | 4/5 | 3/5 |
| ダークモード映え | 4/5 | 5/5 | 4/5 |
| shadcn/ui互換性 | 5/5 | 4/5 | 4/5 |
| 開発者ウケ | 4/5 | 5/5 | 3/5 |
| AI-native感 | 3/5 | 5/5 | 4/5 |
| **合計** | **26** | **32** | **25** |

### 推奨: Candidate B "Electric Indigo"

**理由:**
1. 「AIのためのTodoアプリ」というコアメッセージにインディゴ/バイオレットが最も合致
2. Vercel / Supabase / Linearユーザーに馴染みのあるカラー言語
3. ダークモードでの視認性・美しさが最も高い
4. shadcn/uiのカスタマイズ範囲内で実装可能
5. Candidate Aは安全だが差別化が弱い。Candidate Cは達成感は良いがAI-native感が薄い

---

## 4. Wireframes (Candidate B ベース)

### Information Architecture

```
Login (/)
│
├── Todo List (/todos)  ← メイン画面
│   ├── Inline Create
│   ├── Tree Toggle (expand/collapse)
│   └── Quick Complete Toggle
│
├── Todo Detail (/todos/:id)
│   ├── Edit Title
│   ├── Set Due Date / Priority / Category
│   └── Delete
│
└── Settings (/settings)
    ├── API Key List
    ├── Generate API Key
    └── Logout
```

### 4.1 Login Screen (Mobile 375px)

```
┌─────────────────────────────┐
│                             │
│         ┌─────────┐         │
│         │  Logo   │         │
│         │   ✦     │         │
│         └─────────┘         │
│                             │
│      todo-with-any-ai       │  H2, font-semibold
│                             │
│   AIエージェントのための       │  Body, text-muted
│     Todoアプリ。              │
│     人間も使える。            │
│                             │
│  ┌───────────────────────┐  │
│  │  ◉ GitHubでログイン    │  │  bg-zinc-900 text-white
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  ◉ Googleでログイン    │  │  bg-white border text-zinc-700
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### 4.2 Todo List Screen (Mobile 375px)

```
┌─────────────────────────────┐
│ ✦ todo-with-any-ai     [⚙] │  Header (h-12, sticky top)
├─────────────────────────────┤
│                             │
│ ▼ 💼 プロジェクトA      [H] │  Root todo, work icon, High badge
│   ☐ APIの設計をする         │  Child, depth=1 (indent 24px)
│   ☑ DB設計を完了する ──────  │  Completed (strikethrough, opacity-50)
│   ▼ フロントエンド実装  [M] │  Child with children, Medium
│     ☐ ログイン画面      2d │  Depth=2 (indent 48px), due in 2d
│     ☐ Todo一覧画面      !  │  Overdue (red !)
│                             │
│ ▶ 🛒 買い物リスト          │  Collapsed, shopping icon
│                             │
│ ☐ 💡 新しいアイデア         │  Root, idea icon, no children
│                             │
│   ☐ 🏃 ジョギング30分  tmrw │  health icon, due tomorrow
│                             │
│                    [+ 追加] │  FAB style, Primary color
└─────────────────────────────┘
```

**Todo Row Structure (48px height):**
```
[indent][toggle][icon] [title]                [badges] [due]
```

**Visual Rules:**
- 完了Todo: `opacity-50` + `line-through` on title
- 期限切れ: due部分を `text-error` + `!` マーク
- 期限間近(24h以内): due部分を `text-warning`
- 折りたたみトグル: `▼`(expanded) / `▶`(collapsed) / 非表示(leaf)

### 4.3 Todo Detail / Edit Screen (Mobile 375px)

```
┌─────────────────────────────┐
│ [←]  Todo詳細          [🗑] │  Header (back + delete)
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ ☐  タイトル入力欄     │  │  Checkbox + editable title
│  └───────────────────────┘  │
│                             │
│  📂 カテゴリ                │
│  [work] [personal] [shop]   │  Chip selector
│  [health] [study] [idea]    │
│                             │
│  ⚡ 優先度                   │
│  ( 高 ) ( 中 ) ( 低 ) (なし) │  Segmented control
│                             │
│  📅 締切日                   │
│  [2026-04-01         ✕]     │  Date input + clear button
│                             │
│  📁 親Todo                   │
│  [プロジェクトA        ▼]   │  Select dropdown
│                             │
│  ┌───────────────────────┐  │
│  │      保存する          │  │  Primary button (full width)
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### 4.4 Settings Screen (Mobile 375px)

```
┌─────────────────────────────┐
│ [←]  設定                   │
├─────────────────────────────┤
│                             │
│  API Keys                   │  H3
│  ┌───────────────────────┐  │
│  │ My Claude Key          │  │  Key name
│  │ 作成: 2026-03-20       │  │  Small, text-muted
│  │ 最終使用: 2026-03-29   │  │
│  │              [🗑 削除]  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   + APIキーを発行する   │  │  Secondary button
│  └───────────────────────┘  │
│                             │
│  アカウント                  │  H3
│  parker@github              │
│                             │
│  ┌───────────────────────┐  │
│  │     ログアウト          │  │  Ghost button, text-error
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

---

## 5. Responsive Behavior

| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column, full-width |
| Tablet | 640px - 1024px | Max-width 640px, centered |
| Desktop | > 1024px | Max-width 768px, centered |

---

## 6. Implementation Notes

### shadcn/ui Components to Use

Button, Input, Dialog, Checkbox, Badge, Skeleton, Popover+Calendar, Select, Separator, ToggleGroup

### Custom Components to Build

| Component | Description |
|-----------|-------------|
| `TodoRow` | ツリー行: indent + toggle + icon + title + badges + due |
| `TodoTree` | 再帰的ツリーレンダリング |
| `CategoryChip` | カテゴリ選択チップ |
| `PriorityBadge` | 優先度バッジ (H/M/L with colors) |
| `ApiKeyCard` | APIキー表示カード |
| `EmptyState` | 汎用空状態コンポーネント |

### CSS Custom Properties (Candidate B)

```css
:root {
  --color-primary: #6366F1;
  --color-primary-light: #818CF8;
  --color-primary-dark: #4F46E5;
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-muted: #9CA3AF;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --tree-indent: 24px;
}

.dark {
  --color-primary: #818CF8;
  --color-primary-light: #A5B4FC;
  --color-primary-dark: #6366F1;
  --color-background: #030712;
  --color-surface: #111827;
  --color-border: #1F2937;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --color-info: #60A5FA;
}
```

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-03-29 | Initial design system with 3 candidates. Recommended: Candidate B |
