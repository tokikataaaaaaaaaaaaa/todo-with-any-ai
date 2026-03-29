"use client";

import { useState } from "react";

// =============================================================================
// Design B: "Paper & Ink" - Static Demo Page
// =============================================================================

// -- Color Tokens -------------------------------------------------------------
const colors = {
  bg: "#FAF8F5",
  cardBg: "#FFFFFF",
  border: "#E8E4DE",
  primary: "#1A1A1A", // sumi
  accent: "#C4453C", // shu (vermillion)
  green: "#2E5C3F", // matcha
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6560",
  ai: "#2E5C3F", // indigo
  indigo: "#2B4B7E",
  yamabuki: "#D4982A",
} as const;

// -- Project color palette (Japanese-style) -----------------------------------
const projectColors = {
  shu: "#C4453C",
  matcha: "#2E5C3F",
  ai: "#2B4B7E",
  yamabuki: "#D4982A",
  sumi: "#1A1A1A",
} as const;

// -- Priority badge -----------------------------------------------------------
function PriorityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "High", bg: "#C4453C", fg: "#fff" },
    medium: { label: "Med", bg: "#D4982A", fg: "#fff" },
    low: { label: "Low", bg: "#E8E4DE", fg: "#6B6560" },
  };
  const c = config[level];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "2px 8px",
        borderRadius: 4,
        background: c.bg,
        color: c.fg,
        lineHeight: "18px",
      }}
    >
      {c.label}
    </span>
  );
}

// -- Due date label -----------------------------------------------------------
function DueLabel({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 8,
      }}
    >
      {text}
    </span>
  );
}

// -- Todo item ----------------------------------------------------------------
function TodoItem({
  title,
  done,
  priority,
  due,
  onToggle,
}: {
  title: string;
  done: boolean;
  priority?: "high" | "medium" | "low";
  due?: string;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        cursor: "pointer",
        transition: "background 0.15s",
        background: hovered ? "#F5F2EE" : "transparent",
      }}
    >
      {/* Checkbox circle */}
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: done ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done ? colors.accent : "transparent",
          transition: "all 0.2s",
        }}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: "'Noto Sans JP', sans-serif",
          color: done ? colors.textSecondary : colors.textPrimary,
          textDecoration: done ? "line-through" : "none",
          transition: "color 0.2s",
        }}
      >
        {title}
      </span>

      {/* Meta: priority + due */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {priority && <PriorityBadge level={priority} />}
        {due && <DueLabel text={due} />}
      </div>
    </div>
  );
}

// -- Project section ----------------------------------------------------------
function ProjectSection({
  icon,
  name,
  accentColor,
  items,
}: {
  icon: string;
  name: string;
  accentColor: string;
  items: {
    id: string;
    title: string;
    done: boolean;
    priority?: "high" | "medium" | "low";
    due?: string;
  }[];
}) {
  const [todos, setTodos] = useState(items);

  const toggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const total = todos.length;
  const completed = todos.filter((t) => t.done).length;

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 2,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        borderLeft: `3px solid ${accentColor}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontWeight: 700,
              fontSize: 16,
              color: colors.primary,
              letterSpacing: "0.02em",
            }}
          >
            {name}
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {completed}/{total}
        </span>
      </div>

      {/* Items */}
      <div>
        {todos.map((item) => (
          <TodoItem
            key={item.id}
            title={item.title}
            done={item.done}
            priority={item.priority}
            due={item.due}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>

      {/* Add task */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: colors.textSecondary,
          fontSize: 14,
          cursor: "pointer",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        <span>タスクを追加</span>
      </div>
    </div>
  );
}

// -- Sidebar nav item ---------------------------------------------------------
function SidebarItem({
  icon,
  label,
  count,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 4,
        cursor: "pointer",
        background: active ? "#F0EDE8" : hovered ? "#F5F2EE" : "transparent",
        transition: "background 0.15s",
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 14,
        color: active ? colors.primary : colors.textSecondary,
        fontWeight: active ? 600 : 400,
      }}
    >
      <span style={{ width: 20, display: "flex", justifyContent: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 12, color: colors.textSecondary }}>{count}</span>
      )}
    </div>
  );
}

// -- Quick input bar ----------------------------------------------------------
function QuickInput() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: colors.cardBg,
        borderRadius: 2,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${colors.border}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.textSecondary,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        タスクを追加...  自然言語で入力できます
      </span>
      <span
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: 4,
          padding: "2px 8px",
          fontFamily: "monospace",
        }}
      >
        /
      </span>
    </div>
  );
}

// -- AI suggestion chip -------------------------------------------------------
function AISuggestion({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 4,
        border: `1px solid ${hovered ? colors.green : colors.border}`,
        background: hovered ? "#F0F5F1" : colors.cardBg,
        fontSize: 13,
        color: colors.green,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke={colors.green} strokeWidth="1.2" />
        <path d="M4.5 7.5L6 9L9.5 5" stroke={colors.green} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {text}
    </span>
  );
}

// =============================================================================
// Main Page
// =============================================================================
export default function DesignBPage() {
  return (
    <>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* Washi texture overlay via CSS noise */}
      <style>{`
        .washi-bg {
          position: relative;
        }
        .washi-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
          background-size: 256px 256px;
          z-index: 0;
        }
        .washi-bg > * {
          position: relative;
          z-index: 1;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.4s ease-out both;
        }
        .fade-in-up-1 { animation-delay: 0.05s; }
        .fade-in-up-2 { animation-delay: 0.12s; }
        .fade-in-up-3 { animation-delay: 0.2s; }
        .fade-in-up-4 { animation-delay: 0.28s; }

        /* Sumi stroke decorative divider */
        .sumi-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #1A1A1A 20%, #1A1A1A 80%, transparent 100%);
          opacity: 0.08;
          margin: 0 auto;
        }
      `}</style>

      <div
        className="washi-bg"
        style={{
          minHeight: "100vh",
          background: colors.bg,
          fontFamily: "'Noto Sans JP', sans-serif",
          color: colors.textPrimary,
        }}
      >
        {/* ---------- Header ---------- */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(250,248,245,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo mark: a small sumi circle */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7.5L6 10.5L11 4"
                  stroke="#FAF8F5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "0.04em",
                color: colors.primary,
              }}
            >
              Todo with Any AI
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke={colors.green} strokeWidth="1.2" />
                <circle cx="7" cy="7" r="2" fill={colors.green} />
              </svg>
              AI Connected
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#E8E4DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: colors.primary,
              }}
            >
              P
            </div>
          </div>
        </header>

        {/* ---------- Body ---------- */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
          {/* ---- Sidebar ---- */}
          <aside
            style={{
              width: 240,
              padding: "24px 16px",
              borderRight: `1px solid ${colors.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <SidebarItem
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 8H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M8 5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
              label="すべて"
              count={5}
              active
            />
            <SidebarItem
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              label="今日"
              count={2}
            />
            <SidebarItem
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 2V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M11 2V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M2 7H14" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              }
              label="近日中"
              count={3}
            />

            <div style={{ margin: "16px 0 8px", padding: "0 12px" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: colors.textSecondary,
                }}
              >
                Projects
              </span>
            </div>

            <SidebarItem
              icon={<span style={{ width: 8, height: 8, borderRadius: "50%", background: projectColors.shu, display: "inline-block" }} />}
              label="仕事"
              count={3}
            />
            <SidebarItem
              icon={<span style={{ width: 8, height: 8, borderRadius: "50%", background: projectColors.matcha, display: "inline-block" }} />}
              label="プライベート"
              count={2}
            />
            <SidebarItem
              icon={<span style={{ width: 8, height: 8, borderRadius: "50%", background: projectColors.ai, display: "inline-block" }} />}
              label="学習"
            />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* AI hint */}
            <div
              style={{
                padding: "12px",
                borderRadius: 4,
                border: `1px dashed ${colors.border}`,
                fontSize: 12,
                color: colors.textSecondary,
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 600, color: colors.green }}>AI Tip</span>
              <br />
              「/」キーで AI コマンドを呼び出せます
            </div>
          </aside>

          {/* ---- Main content ---- */}
          <main
            style={{
              flex: 1,
              padding: "32px 40px",
              maxWidth: 720,
            }}
          >
            {/* Page title */}
            <div className="fade-in-up fade-in-up-1">
              <h1
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  fontWeight: 700,
                  fontSize: 26,
                  letterSpacing: "0.03em",
                  marginBottom: 4,
                  color: colors.primary,
                }}
              >
                すべてのタスク
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 24,
                }}
              >
                3件の未完了タスクがあります
              </p>
            </div>

            {/* Quick input */}
            <div className="fade-in-up fade-in-up-2" style={{ marginBottom: 28 }}>
              <QuickInput />
            </div>

            {/* AI suggestions */}
            <div className="fade-in-up fade-in-up-2" style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                AI Suggestions
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <AISuggestion text="「API設計」をサブタスクに分解" />
                <AISuggestion text="今日のタスクを優先度順に並べ替え" />
              </div>
            </div>

            {/* Decorative divider */}
            <div className="sumi-divider" style={{ width: "100%", marginBottom: 24 }} />

            {/* Project: Work */}
            <div className="fade-in-up fade-in-up-3" style={{ marginBottom: 24 }}>
              <ProjectSection
                icon="&#x1f4bc;"
                name="仕事"
                accentColor={projectColors.shu}
                items={[
                  { id: "w1", title: "APIの設計をする", done: false, priority: "high" },
                  { id: "w2", title: "DB設計を完了する", done: true },
                  { id: "w3", title: "フロントエンド実装", done: false, priority: "medium", due: "2日後" },
                ]}
              />
            </div>

            {/* Project: Private */}
            <div className="fade-in-up fade-in-up-4" style={{ marginBottom: 24 }}>
              <ProjectSection
                icon="&#x1f3e0;"
                name="プライベート"
                accentColor={projectColors.matcha}
                items={[
                  { id: "p1", title: "買い物に行く", done: false, due: "明日" },
                  { id: "p2", title: "ジョギング30分", done: false, priority: "low" },
                ]}
              />
            </div>

            {/* Color palette showcase */}
            <div className="fade-in-up fade-in-up-4" style={{ marginTop: 40 }}>
              <p
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                }}
              >
                Color Palette
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {Object.entries(projectColors).map(([name, color]) => (
                  <div key={name} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        background: color,
                        marginBottom: 4,
                      }}
                    />
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Button samples */}
            <div className="fade-in-up fade-in-up-4" style={{ marginTop: 32 }}>
              <p
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                }}
              >
                Buttons
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {/* Primary - sumi */}
                <button
                  style={{
                    padding: "8px 20px",
                    borderRadius: 4,
                    background: colors.primary,
                    color: colors.bg,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  保存する
                </button>
                {/* Accent - shu */}
                <button
                  style={{
                    padding: "8px 20px",
                    borderRadius: 4,
                    background: colors.accent,
                    color: "#fff",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  タスク追加
                </button>
                {/* Outline */}
                <button
                  style={{
                    padding: "8px 20px",
                    borderRadius: 4,
                    background: "transparent",
                    color: colors.primary,
                    border: `1px solid ${colors.border}`,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>

            {/* Typography showcase */}
            <div className="fade-in-up fade-in-up-4" style={{ marginTop: 32, marginBottom: 60 }}>
              <p
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                }}
              >
                Typography
              </p>
              <div
                style={{
                  background: colors.cardBg,
                  borderRadius: 2,
                  padding: 24,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 8,
                    letterSpacing: "0.03em",
                  }}
                >
                  Noto Serif JP - 見出し
                </h2>
                <p
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Noto Sans JP - 本文テキスト。和紙のような質感と墨のタイポグラフィで、
                  ミニマルでありながら温かみのあるデザインを実現します。
                </p>
                <p
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  セカンダリテキスト - 補足情報や日時などの表示に使用
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
