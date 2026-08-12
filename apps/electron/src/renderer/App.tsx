/**
 * Kairós Desktop Alves — chat UI funcional.
 *
 * Sprint 1.2: usa a API do preload pra mandar mensagens e receber eventos.
 */

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  dangerous?: boolean;
  ts: number;
}

const SESSION_ID = "session-" + Date.now();

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProviderState] = useState<ProviderConfig | null>(null);
  const [toolCount, setToolCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Init: pega provider, inicia sessão
  useEffect(() => {
    void (async () => {
      const p = await window.kairos!.getProvider();
      setProviderState(p);

      const session = await window.kairos!.start(SESSION_ID);
      setToolCount(session.toolCount);
      addSystemMessage(
        `Sessão iniciada. ${session.toolCount} tools disponíveis. Provider: ${p.provider} / ${p.modelId}`
      );
    })();

    // Subscribe a eventos do agent
    const off = window.kairos!.onAgentEvent(SESSION_ID, (event: AgentEvent) => {
      handleAgentEvent(event);
    });
    return () => off();
  }, []);

  // Auto-scroll
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
          // Acumula na última mensagem do assistant, ou cria nova
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
          // Não polui UI, pode ser exibido em indicador separado no futuro
          return m;
        case "permission:request":
          // UI simples: alerta nativo do browser
          window.alert(`⚠️ ${event.prompt}\n\nTool: ${event.tool}\n\n(Em produção, popup custom)`);
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

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() },
    ]);
    try {
      await window.kairos!.send(SESSION_ID, text);
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

      {/* Settings panel */}
      {showSettings && provider && (
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Configurações de Provider</h2>
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
              placeholder="model ID (ex: anthropic/claude-3.5-sonnet)"
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={provider.apiKey ?? ""}
              onChange={(e) => handleProviderChange({ ...provider, apiKey: e.target.value || undefined })}
              placeholder="API key (opcional — usa env se vazio)"
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            KAIROS_API_KEY, KAIROS_PROVIDER e KAIROS_MODEL também funcionam via env.
          </p>
        </div>
      )}

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-2xl">O que você quer que eu faça?</p>
              <p className="mt-2 text-sm">
                {toolCount} tools disponíveis — arquivos, planilhas, PDFs, Word, imagens, vídeo.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

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
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Anexar arquivo"
            title="Anexar arquivo (Sprint 2)"
            disabled
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
            disabled={busy || !draft.trim()}
          >
            {busy ? "..." : "➤"}
          </button>
        </form>
      </footer>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const base = "max-w-[85%] rounded-lg px-4 py-2 text-sm";
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className={`${base} bg-emerald-600 text-white`}>{msg.content}</div>
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
  // system
  return (
    <div className="flex justify-center">
      <div className="text-xs text-slate-500 italic">{msg.content}</div>
    </div>
  );
}
