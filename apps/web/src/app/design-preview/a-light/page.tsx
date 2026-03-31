"use client";

import { useState } from "react";

/* ───────────── colour tokens (Light Mode) ── */
const C = {
  bg: "#FAFBFE",
  card: "#FFFFFF",
  border: "#E8E5F0",
  text: "#1A1A2E",
  muted: "#6B7280",
  gradient: "linear-gradient(135deg, #7C3AED, #2563EB, #06B6D4)",
  purple: "#7C3AED",
  blue: "#2563EB",
  cyan: "#06B6D4",
  glow: "0 0 20px rgba(124,58,237,.15), 0 0 40px rgba(6,182,212,.08)",
  glowCyan: "0 0 12px rgba(6,182,212,.2)",
} as const;

/* ───────────── keyframes (injected once) ─ */
const keyframes = `
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap');

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(6,182,212,.15); }
  50%      { box-shadow: 0 0 20px rgba(6,182,212,.3); }
}
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

/* ───────────── shared helpers ───────────── */
const glass = {
  background: "rgba(255,255,255,0.8)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${C.border}`,
  borderRadius: 14,
} as React.CSSProperties;

const stagger = (i: number): React.CSSProperties => ({
  animation: `fadeInUp .5s ease both`,
  animationDelay: `${i * 0.08}s`,
});

/* ───────────── small components ─────────── */

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "'Geist Mono', monospace",
        padding: "2px 8px",
        borderRadius: 6,
        background: `${color}15`,
        color,
        border: `1px solid ${color}33`,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ level }: { level: "high" | "mid" | "low" }) {
  const map = {
    high: { label: "High", color: "#DC2626" },
    mid: { label: "Mid", color: "#D97706" },
    low: { label: "Low", color: "#0891B2" },
  };
  return <Badge {...map[level]} />;
}

function DueBadge({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "'Geist Mono', monospace",
        color: C.muted,
        marginLeft: 4,
      }}
    >
      {text}
    </span>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: checked ? "none" : `2px solid ${C.border}`,
        background: checked ? C.gradient : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all .25s ease",
        boxShadow: checked ? C.glowCyan : "none",
        animation: checked ? "pulse-glow 2s ease-in-out infinite" : "none",
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5L5 9L10 3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority?: "high" | "mid" | "low";
  due?: string;
}

interface Project {
  emoji: string;
  name: string;
  color: string;
  todos: TodoItem[];
}

/* ───────────── demo data ────────────────── */
const initialProjects: Project[] = [
  {
    emoji: "\uD83D\uDCBC",
    name: "仕事プロジェクト",
    color: C.purple,
    todos: [
      { id: "w1", text: "APIの設計をする", done: false, priority: "high" },
      { id: "w2", text: "DB設計を完了する", done: true },
      {
        id: "w3",
        text: "フロントエンド実装",
        done: false,
        priority: "mid",
        due: "2日後",
      },
    ],
  },
  {
    emoji: "\uD83C\uDFE0",
    name: "プライベート",
    color: C.cyan,
    todos: [
      { id: "p1", text: "買い物に行く", done: false, due: "明日" },
      { id: "p2", text: "ジョギング30分", done: false, priority: "low" },
    ],
  },
];

/* ───────────── calendar mini ────────────── */
function MiniCalendar() {
  const days = ["月", "火", "水", "木", "金", "土", "日"];
  // Render a fake week around "today" (day 30)
  const dates = [28, 29, 30, 31, 1, 2, 3];
  const today = 30;
  const hasDot = [31, 1]; // days with tasks

  return (
    <div style={{ ...glass, padding: 20, ...stagger(8) }}>
      <h3
        style={{
          margin: "0 0 14px",
          fontSize: 14,
          fontWeight: 600,
          color: C.text,
        }}
      >
        2026年3月
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          textAlign: "center",
          fontFamily: "'Geist Mono', monospace",
          fontSize: 12,
        }}
      >
        {days.map((d) => (
          <span key={d} style={{ color: C.muted, marginBottom: 4 }}>
            {d}
          </span>
        ))}
        {dates.map((d) => {
          const isToday = d === today;
          return (
            <span
              key={d}
              style={{
                padding: "6px 0",
                borderRadius: 8,
                position: "relative",
                color: isToday ? "#fff" : d < 28 ? C.muted : C.text,
                background: isToday ? C.gradient : "transparent",
                fontWeight: isToday ? 600 : 400,
                cursor: "pointer",
                transition: "background .2s",
              }}
            >
              {d}
              {hasDot.includes(d) && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: C.cyan,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── settings section ─────────── */
function SettingsSection() {
  return (
    <div style={{ ...glass, padding: 24, ...stagger(9) }}>
      <h3
        style={{
          margin: "0 0 18px",
          fontSize: 14,
          fontWeight: 600,
          color: C.text,
        }}
      >
        Settings
      </h3>

      {/* API Key */}
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: C.muted,
          marginBottom: 6,
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        AI Provider API Key
      </label>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <input
          type="password"
          defaultValue="sk-xxxxxxxxxxxxxxxxxxxx"
          readOnly
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.bg,
            color: C.text,
            fontSize: 13,
            fontFamily: "'Geist Mono', monospace",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            color: C.purple,
            fontFamily: "'Geist Mono', monospace",
            cursor: "pointer",
          }}
        >
          show
        </span>
      </div>

    </div>
  );
}

/* ═══════════════ PAGE ═══════════════════ */
export default function DesignPreviewALight() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [newTodo, setNewTodo] = useState("");

  const toggleTodo = (projectIdx: number, todoId: string) => {
    setProjects((prev) =>
      prev.map((p, pi) =>
        pi === projectIdx
          ? {
              ...p,
              todos: p.todos.map((t) =>
                t.id === todoId ? { ...t, done: !t.done } : t,
              ),
            }
          : p,
      ),
    );
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "work", label: "\uD83D\uDCBC 仕事" },
    { id: "private", label: "\uD83C\uDFE0 プライベート" },
  ];

  const filteredProjects =
    activeTab === "all"
      ? projects
      : activeTab === "work"
        ? [projects[0]]
        : [projects[1]];

  return (
    <>
      {/* Inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          color: C.text,
          fontFamily:
            "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Aurora ambient glow (softer for light mode) */}
        <div
          style={{
            position: "fixed",
            top: -200,
            left: "30%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,.06) 0%, rgba(6,182,212,.03) 50%, transparent 70%)",
            pointerEvents: "none",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "fixed",
            bottom: -300,
            right: "10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,.05) 0%, rgba(124,58,237,.03) 50%, transparent 70%)",
            pointerEvents: "none",
            filter: "blur(100px)",
          }}
        />

        {/* Content wrapper */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* ─── Header ─── */}
          <header
            style={{
              padding: "40px 0 32px",
              ...stagger(0),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              {/* Logo mark */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: C.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: C.glow,
                  fontSize: 18,
                  color: "#fff",
                }}
              >
                <span role="img" aria-label="check">
                  &#x2713;
                </span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  background: C.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Todo with Any AI
              </h1>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.muted,
                fontFamily: "'Geist Mono', monospace",
              }}
            >
              Lavender Aurora &mdash; Design Preview A (Light)
            </p>
          </header>

          {/* ─── Filter tabs ─── */}
          <nav
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 24,
              ...stagger(1),
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: active ? "none" : `1px solid ${C.border}`,
                    background: active ? C.gradient : "transparent",
                    color: active ? "#fff" : C.muted,
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    transition: "all .25s ease",
                    boxShadow: active ? C.glow : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* ─── Todo list ─── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filteredProjects.map((project, pi) => (
              <div key={project.name} style={{ ...stagger(pi + 2) }}>
                {/* Project heading */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    paddingLeft: 4,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 18,
                      borderRadius: 2,
                      background: project.color,
                      boxShadow: `0 0 8px ${project.color}44`,
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {project.emoji} {project.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      fontFamily: "'Geist Mono', monospace",
                    }}
                  >
                    {project.todos.filter((t) => !t.done).length}/
                    {project.todos.length}
                  </span>
                </div>

                {/* Todo items */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {project.todos.map((todo, ti) => {
                    const actualPi = projects.indexOf(project);
                    return (
                      <div
                        key={todo.id}
                        style={{
                          ...glass,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          borderLeft: `2px solid ${project.color}33`,
                          transition: "all .25s ease",
                          cursor: "default",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          ...stagger(pi + 2 + ti * 0.6),
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            project.color;
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            `0 2px 12px ${project.color}12`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            C.border;
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.04)";
                        }}
                      >
                        <Checkbox
                          checked={todo.done}
                          onChange={() => toggleTodo(actualPi, todo.id)}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 14,
                            textDecoration: todo.done ? "line-through" : "none",
                            color: todo.done ? C.muted : C.text,
                            opacity: todo.done ? 0.4 : 1,
                            transition:
                              "color .25s, text-decoration .25s, opacity .25s",
                          }}
                        >
                          {todo.text}
                        </span>
                        {todo.priority && <PriorityBadge level={todo.priority} />}
                        {todo.due && <DueBadge text={todo.due} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* ─── New todo form ─── */}
          <div style={{ marginTop: 28, ...stagger(6) }}>
            <div
              style={{
                ...glass,
                padding: "6px 6px 6px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ color: C.muted, fontSize: 18, flexShrink: 0 }}>
                +
              </span>
              <input
                type="text"
                placeholder="Add a new todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: C.text,
                  fontSize: 14,
                  padding: "10px 0",
                  fontFamily: "inherit",
                }}
              />
              <button
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: C.gradient,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .25s ease",
                  boxShadow: C.glow,
                  backgroundSize: "200% 200%",
                  animation: "aurora 4s ease infinite",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 30px rgba(124,58,237,.25), 0 0 60px rgba(6,182,212,.12)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = C.glow;
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* ─── Bottom row: Calendar + Settings ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 32,
              marginBottom: 60,
            }}
          >
            <MiniCalendar />
            <SettingsSection />
          </div>

          {/* ─── Footer ─── */}
          <footer
            style={{
              textAlign: "center",
              paddingBottom: 40,
              fontSize: 11,
              color: C.muted,
              fontFamily: "'Geist Mono', monospace",
              ...stagger(10),
            }}
          >
            Design Candidate A &middot; Lavender Aurora (Light) &middot; Static
            Preview
          </footer>
        </div>
      </div>
    </>
  );
}
