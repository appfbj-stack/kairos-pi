/**
 * Kairós Desktop Alves — chat UI funcional com anexos.
 *
 * Sprint 1.3: botão 📎 funcional, file dialog, attachments inline.
 */

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";
import type { Attachment, AttachmentSummary } from "../preload/index.js";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  attachments?: { name: string; size: number }[];
  ts: number;
}

const SESSION_ID = "session-" + Date.now();

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [provider, setProviderState] = useState<ProviderConfig | null>(null);
  const [toolCount, setToolCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Init
  useEffect(() => {
    void (async () => {
      const p = await window.kairos!.getProvider();
      setProviderState(p);

      const session = await window.kairos!.start(SESSION_ID);
      setToolCount(session.toolCount);
      addSystemMessage(
        `Sessão iniciada. ${session.toolCount} tools. Provider: ${p.provider} / ${p.modelId}`
      );
    })();

    const off = window.kairos!.onAgentEvent(SESSION_ID, (event: AgentEvent) => {
      handleAgentEvent(event);
    });
    return () => off();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addSystemMessage(content: string) {
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "system", content, ts: Date.now() },
    ]);
  }

  function handleAgentEvent(event: AgentEvent) {
    setMessages((m) => {
      const last = m[m.length - 1];
      switch (event.type) {
        case "message": {
          if (last && last.role === "assistant") {
            const updated = [...m];
            updated[updated.length - 1] = { ...last, content: last.content + event.content };
            return updated;
          }
          return [
            ...m,
            { id: crypto.randomUUID(), role: "assistant", content: event.content, ts: Date.now() },
          ];
        }
        case "tool:call":
          return [
            ...m,
            {
              id: crypto.randomUUID(),
              role: "tool",
              content: `🔧 ${event.tool}`,
              toolName: event.tool,
              ts: Date.now(),
            },
          ];
        case "tool:result":
          return [
            ...m,
            {
              id: crypto.randomUUID(),
              role: "tool",
              content: typeof event.output === "string"
                ? `✓ ${event.tool} (${event.durationMs}ms): ${event.output.slice(0, 200)}`
                : `✓ ${event.tool} (${event.durationMs}ms)`,
              toolName: event.tool,
              ts: Date.now(),
            },
          ];
        case "progress":
          return m;
        case "permission:request":
          window.alert(`⚠️ ${event.prompt}\n\nTool: ${event.tool}`);
          return m;
        case "done":
          setBusy(false);
          return m;
        case "error":
          return [
            ...m,
            { id: crypto.randomUUID(), role: "system", content: `❌ ${event.message}`, ts: Date.now() },
          ];
      }
    });
  }

  async function handleAttach() {
    if (busy) return;
    const result = await window.kairos!.openFileDialog();
    if (result.canceled) return;
    setPendingAttachments((prev) => [...prev, ...result.files]);
  }

  function removePendingAttachment(idx: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    const text = draft.trim();
    if ((!text && pendingAttachments.length === 0) || busy) return;
    setDraft("");
    setBusy(true);

    // Lê conteúdo dos anexos via IPC
    let attachments: Attachment[] = [];
    if (pendingAttachments.length > 0) {
      try {
        attachments = await window.kairos!.attach(pendingAttachments.map((a) => a.path));
      } catch (err) {
        addSystemMessage(`Erro lendo anexos: ${err instanceof Error ? err.message : String(err)}`);
        setBusy(false);
        return;
      }
    }

    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text || "(anexo)",
        attachments: pendingAttachments.map((a) => ({ name: a.name, size: a.size })),
        ts: Date.now(),
      },
    ]);
    setPendingAttachments([]);

    try {
      await window.kairos!.send(SESSION_ID, text, attachments);
    } catch (err) {
      addSystemMessage(`Erro: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(false);
    }
  }

  async function handleStop() {
    await window.kairos!.stop(SESSION_ID);
  }

  async function handleProviderChange(next: ProviderConfig) {
    await window.kairos!.setProvider(next);
    setProviderState(next);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">Kairós Desktop Alves</h1>
            {provider && (
              <p className="text-xs text-slate-400">
                {provider.provider} · {provider.modelId} · {toolCount} tools
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {busy && (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-500"
            >
              ⏹ Parar
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Configurações"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Settings */}
      {showSettings && provider && (
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Provider</h2>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={provider.provider}
              onChange={(e) => handleProviderChange({ ...provider, provider: e.target.value as ProviderConfig["provider"] })}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="openrouter">openrouter</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="minimax">minimax</option>
            </select>
            <input
              type="text"
              value={provider.modelId}
              onChange={(e) => handleProviderChange({ ...provider, modelId: e.target.value })}
              placeholder="model ID"
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={provider.apiKey ?? ""}
              onChange={(e) => handleProviderChange({ ...provider, apiKey: e.target.value || undefined })}
              placeholder="API key"
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-2xl">O que você quer que eu faça?</p>
              <p className="mt-2 text-sm">
                {toolCount} tools — arquivos, planilhas, PDFs, Word, imagens, vídeo.
              </p>
              <p className="mt-1 text-xs">Anexe arquivos pelo botão 📎 abaixo.</p>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-2">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {pendingAttachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs"
              >
                <span>📎 {a.name}</span>
                <span className="text-slate-500">({formatSize(a.size)})</span>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(i)}
                  className="text-slate-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="border-t border-slate-800 px-6 py-4">
        <form
          className="mx-auto flex max-w-3xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <button
            type="button"
            onClick={handleAttach}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
            aria-label="Anexar arquivo"
            title="Anexar arquivo"
            disabled={busy}
          >
            📎
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="O que você quer fazer?"
            className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            disabled={busy}
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
            disabled={busy || (!draft.trim() && pendingAttachments.length === 0)}
          >
            {busy ? "..." : "➤"}
          </button>
        </form>
      </footer>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function MessageBubble({ msg }: { msg: Message }) {
  const base = "max-w-[85%] rounded-lg px-4 py-2 text-sm";
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className={`${base} bg-emerald-600 text-white`}>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1 text-xs opacity-80">
              {msg.attachments.map((a, i) => (
                <span key={i}>📎 {a.name}</span>
              ))}
            </div>
          )}
          {msg.content}
        </div>
      </div>
    );
  }
  if (msg.role === "assistant") {
    return (
      <div className="flex justify-start">
        <div className={`${base} bg-slate-800 text-slate-100 whitespace-pre-wrap`}>{msg.content || "..."}</div>
      </div>
    );
  }
  if (msg.role === "tool") {
    return (
      <div className="flex justify-start">
        <div className="bg-slate-800/50 text-xs text-slate-400 italic px-3 py-1 rounded">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="text-xs text-slate-500 italic">{msg.content}</div>
    </div>
  );
}
