import { useState } from "react";

// Placeholder for an "Ask AI" analyst assistant. The UI is real and demoable;
// it is deliberately NOT wired to any model. A real version would POST the
// question plus the current filtered event set to a backend (which holds the
// API key — never the browser) and stream the answer back.

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "What are the most critical events right now?",
  "Summarize the brute-force activity on prod-db-01.",
  "Which hosts show signs of lateral movement?",
  "Group today's events by attack category.",
];

const PLACEHOLDER_REPLY =
  "AI responses aren't connected in this preview. In a real deployment this would " +
  "send your question along with the currently filtered events to a backend service " +
  "(which holds the model API key) and stream a grounded, cited answer back here.";

export default function AskAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: PLACEHOLDER_REPLY },
    ]);
    setInput("");
  };

  return (
    <div className="page-container ask-page">
      <div className="events-header">
        <h1>Ask AI</h1>
        <span className="ai-badge">Preview · not connected</span>
      </div>

      <p className="ai-intro">
        Ask questions about your security events in plain language. This is a UI preview — answers
        are placeholders until a backend assistant is connected.
      </p>

      <div className="ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="facet-chip" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="ai-chat">
        {messages.length === 0 ? (
          <p className="facet-empty">Pick a suggested question above, or type your own below.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`ai-msg ai-msg-${m.role}`}>
              <span className="ai-msg-role">{m.role === "user" ? "You" : "Assistant"}</span>
              <p>{m.text}</p>
            </div>
          ))
        )}
      </div>

      <form
        className="ai-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about hosts, severities, tags, time ranges…"
          aria-label="Ask a question about the events"
        />
        <button type="submit" className="btn-primary" disabled={!input.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
