"use client";

import { useState, useEffect } from "react";

// ── Neon Terminal Color Tokens ──────────────────────────────────
const C = {
  bg: "#0D0D0D",
  cardBg: "#111111",
  border: "#1A1A1A",
  primary: "#00FF88",
  secondary: "#00AAFF",
  warning: "#FFAA00",
  error: "#FF3366",
  purple: "#AA66FF",
  textSecondary: "#666666",
} as const;

// ── Typing animation hook ───────────────────────────────────────
function useTyping(text: string, speed = 60, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const startTimeout = setTimeout(() => {
      const tick = () => {
        if (i < text.length) {
          i++;
          setDisplayed(text.slice(0, i));
          timeout = setTimeout(tick, speed);
        } else {
          setDone(true);
        }
      };
      tick();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, speed, delay]);

  return { displayed, done };
}

// ── Blinking cursor ─────────────────────────────────────────────
function Cursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ color: C.primary, opacity: visible ? 1 : 0 }}>_</span>
  );
}

// ── Data ────────────────────────────────────────────────────────
type Todo = {
  text: string;
  done: boolean;
  priority?: "HIGH" | "MED" | "LOW";
  due?: string;
};

type Project = {
  icon: string;
  name: string;
  color: string;
  todos: Todo[];
};

const projects: Project[] = [
  {
    icon: "\uD83D\uDCBC",
    name: "\u4ED5\u4E8B",
    color: C.secondary,
    todos: [
      { text: "API\u306E\u8A2D\u8A08\u3092\u3059\u308B", done: false, priority: "HIGH" },
      { text: "DB\u8A2D\u8A08\u3092\u5B8C\u4E86\u3059\u308B", done: true },
      { text: "\u30D5\u30ED\u30F3\u30C8\u30A8\u30F3\u30C9\u5B9F\u88C5", done: false, priority: "MED", due: "2d" },
    ],
  },
  {
    icon: "\uD83C\uDFE0",
    name: "\u30D7\u30E9\u30A4\u30D9\u30FC\u30C8",
    color: C.warning,
    todos: [
      { text: "\u8CB7\u3044\u7269\u306B\u884C\u304F", done: false, due: "tmrw" },
      { text: "\u30B8\u30E7\u30AE\u30F3\u30B030\u5206", done: false, priority: "LOW" },
    ],
  },
];

const totalTodos = projects.reduce((s, p) => s + p.todos.length, 0);
const completedTodos = projects.reduce(
  (s, p) => s + p.todos.filter((t) => t.done).length,
  0
);

// ── Priority badge ──────────────────────────────────────────────
function PriorityBadge({ level }: { level?: "HIGH" | "MED" | "LOW" }) {
  if (!level) return null;
  const colorMap = { HIGH: C.error, MED: C.warning, LOW: C.textSecondary };
  return (
    <span
      style={{
        color: colorMap[level],
        border: `1px solid ${colorMap[level]}`,
        padding: "0 6px",
        fontSize: 11,
        letterSpacing: 1,
      }}
    >
      {level}
    </span>
  );
}

// ── Checkbox ────────────────────────────────────────────────────
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
      style={{
        background: "transparent",
        border: "none",
        color: checked ? C.primary : C.textSecondary,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        padding: 0,
        lineHeight: 1,
      }}
    >
      {checked ? "[x]" : "[ ]"}
    </button>
  );
}

// ── Todo Row ────────────────────────────────────────────────────
function TodoRow({ todo }: { todo: Todo }) {
  const [checked, setChecked] = useState(todo.done);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 0",
        opacity: checked ? 0.4 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <Checkbox checked={checked} onChange={() => setChecked((c) => !c)} />
      <span
        style={{
          flex: 1,
          color: checked ? C.textSecondary : C.primary,
          textDecoration: checked ? "line-through" : "none",
          fontSize: 14,
        }}
      >
        {todo.text}
      </span>
      {checked ? (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>
          ------
        </span>
      ) : (
        <>
          <PriorityBadge level={todo.priority} />
          {todo.due && (
            <span style={{ color: C.textSecondary, fontSize: 12 }}>
              {todo.due}
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ── Project Section ─────────────────────────────────────────────
function ProjectSection({ project }: { project: Project }) {
  const divider = "\u2500".repeat(30);
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          color: project.color,
          fontSize: 14,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>
          {project.icon} {project.name}
        </span>
        <span style={{ color: C.border, letterSpacing: -1 }}>{divider}</span>
      </div>
      {project.todos.map((todo, i) => (
        <TodoRow key={i} todo={todo} />
      ))}
    </div>
  );
}

// ── Scanline overlay ────────────────────────────────────────────
function Scanlines() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        background:
          "repeating-linear-gradient(0deg, rgba(0,255,136,0.03) 0px, rgba(0,255,136,0.03) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function DesignPreviewC() {
  const title = useTyping("todo-with-any-ai v0.1.0", 50, 300);
  const line2 = useTyping("user: tokikata", 40, 1600);
  const line3 = useTyping(
    `projects: ${projects.length} | todos: ${totalTodos} | completed: ${completedTodos}`,
    30,
    2400
  );

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [inputValue, setInputValue] = useState("");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 3400);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { label: "\uD83D\uDCBC \u4ED5\u4E8B", key: "\u4ED5\u4E8B", color: C.secondary },
    { label: "\uD83C\uDFE0 \u30D7\u30E9\u30A4\u30D9\u30FC\u30C8", key: "\u30D7\u30E9\u30A4\u30D9\u30FC\u30C8", color: C.warning },
    { label: "ALL", key: "ALL", color: C.primary },
  ];

  const filteredProjects =
    activeTab === "ALL"
      ? projects
      : projects.filter((p) => p.name === activeTab);

  return (
    <>
      <Scanlines />

      {/* Google Fonts: JetBrains Mono */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; }

        .neon-glow:hover {
          box-shadow: 0 0 10px ${C.primary}, 0 0 20px ${C.primary}44;
        }

        .neon-glow-blue:hover {
          box-shadow: 0 0 10px ${C.secondary}, 0 0 20px ${C.secondary}44;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid ${C.border};
          color: ${C.textSecondary};
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          border-color: ${C.primary};
          color: ${C.primary};
          box-shadow: 0 0 8px ${C.primary}44;
        }
        .tab-btn.active {
          border-color: ${C.primary};
          color: ${C.primary};
          box-shadow: 0 0 10px ${C.primary}44;
        }

        .fade-in {
          animation: fadeIn 0.6s ease-in forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .input-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid ${C.border};
        }
        .input-line input {
          background: transparent;
          border: none;
          color: ${C.primary};
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          outline: none;
          flex: 1;
          caret-color: ${C.primary};
        }
        .input-line input::placeholder {
          color: ${C.textSecondary};
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.primary,
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          justifyContent: "center",
          padding: "48px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          {/* ── Header: typing lines ─────────────────────────── */}
          <div
            style={{
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <div>
                <span style={{ color: C.textSecondary }}>{">"} </span>
                {title.displayed}
                {!title.done && <Cursor />}
              </div>
              <div>
                <span style={{ color: C.textSecondary }}>{">"} </span>
                <span style={{ color: C.secondary }}>{line2.displayed}</span>
                {title.done && !line2.done && <Cursor />}
              </div>
              <div>
                <span style={{ color: C.textSecondary }}>{">"} </span>
                <span style={{ color: C.warning }}>{line3.displayed}</span>
                {line2.done && !line3.done && <Cursor />}
              </div>
            </div>
          </div>

          {/* ── Tabs + Content (fade in after typing) ────────── */}
          {showContent && (
            <div className="fade-in">
              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                    style={
                      activeTab === tab.key
                        ? { borderColor: tab.color, color: tab.color, boxShadow: `0 0 10px ${tab.color}44` }
                        : undefined
                    }
                  >
                    [{tab.label}]
                  </button>
                ))}
              </div>

              {/* Card */}
              <div
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  padding: 24,
                }}
              >
                {filteredProjects.map((project) => (
                  <ProjectSection key={project.name} project={project} />
                ))}

                {/* Input line */}
                <div className="input-line">
                  <span style={{ color: C.textSecondary }}>{">"}</span>
                  <span style={{ color: C.secondary }}>add_todo:</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter a new todo..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        setInputValue("");
                      }
                    }}
                  />
                  {!inputValue && <Cursor />}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                  color: C.textSecondary,
                  fontSize: 11,
                }}
              >
                <span style={{ color: C.primary }}>NEON TERMINAL</span>
                {" // "}
                Design Candidate C{" // "}
                <span style={{ color: C.purple }}>todo-with-any-ai</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
