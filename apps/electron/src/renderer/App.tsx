/**
 * Kairós Desktop Alves — chat UI com sidebar de conversas.
 *
 * Sprint 1.4: persistência. Sidebar lista conversas, click carrega histórico,
 * botão "+" cria nova.
 *
 * Sprint 1.5: modal de confirmação para tools destrutivas. Substitui o
 * `window.alert` feio. O componente `<PermissionModal />` aparece centralizado
 * com backdrop blur, mostra tool + argumentos, e o user escolhe Permitir/Negar.
 */

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";
import type { Attachment, PermissionRequest } from "../preload/index.js";

interface Conversation {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string | null;
}

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
  const [sessionId, setSessionId] = useState<string>(SESSION_ID);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; size: number; path: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [provider, setProviderState] = useState<ProviderConfig | null>(null);
  const [toolCount, setToolCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Init: provider, lista conversas, sessão inicial
  useEffect(() => {
    void (async () => {
      const p = await window.kairos!.getProvider();
      setProviderState(p);

      const convs = await window.kairos!.conversations.list();
      setConversations(convs);

      // Cria primeira conversa se não tem nenhuma
      let currentConv = convs[0];
      if (!currentConv) {
        currentConv = await window.kairos!.conversations.create("Nova conversa");
        setConversations([currentConv]);
      }
      setSessionId(currentConv.id);

      const session = await window.kairos!.start(currentConv.id);
      setToolCount(session.toolCount);

      // Carrega mensagens da conversa
      const data = await window.kairos!.conversations.get(currentConv.id);
      if (data) {
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role as Message["role"],
            content: m.content,
            toolName: m.toolName ?? undefined,
            attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
            ts: m.createdAt,
          }))
        );
      }

      addSystemMessage(
        `Kairós pronto. ${session.toolCount} tools. Provider: ${p.provider} / ${p.modelId}.`
      );
    })();

    return () => {};
  }, []);

  // Subscribe a eventos do agent quando sessionId muda
  useEffect(() => {
    const off = window.kairos!.onAgentEvent(sessionId, (event: AgentEvent) => {
      handleAgentEvent(event);
    });
    return () => off();
  }, [sessionId]);

  // Subscribe a pedidos de permissão (modal centralizado)
  useEffect(() => {
    const off = window.kairos!.onPermissionRequest((req) => {
      setPermissionRequest(req);
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
            { id: crypto.randomUUID(), role: "tool", content: `🔧 ${event.tool}`, toolName: event.tool, ts: Date.now() },
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
          // O modal centralizado cuida da UI; aqui só logamos silenciosamente.
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

  async function handleNewConversation() {
    const conv = await window.kairos!.conversations.create("Nova conversa");
    setConversations((cs) => [conv, ...cs]);
    setSessionId(conv.id);
    setMessages([]);
  }

  async function handleSwitchConversation(id: string) {
    if (busy) return;
    setSessionId(id);
    const data = await window.kairos!.conversations.get(id);
    if (data) {
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role as Message["role"],
          content: m.content,
          toolName: m.toolName ?? undefined,
          attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
          ts: m.createdAt,
        }))
      );
    }
  }

  async function handleDeleteConversation(id: string) {
    if (!window.confirm("Excluir esta conversa?")) return;
    await window.kairos!.conversations.delete(id);
    setConversations((cs) => cs.filter((c) => c.id !== id));
    if (id === sessionId && conversations.length > 1) {
      const next = conversations.find((c) => c.id !== id);
      if (next) await handleSwitchConversation(next.id);
    }
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
    const pending = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      await window.kairos!.send(sessionId, text, attachments);
      // Atualiza lista (ordem)
      const convs = await window.kairos!.conversations.list();
      setConversations(convs);
    } catch (err) {
      addSystemMessage(`Erro: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(false);
    }
    void pending; // silence unused
  }

  async function handleStop() {
    await window.kairos!.stop(sessionId);
  }

  async function handleProviderChange(next: ProviderConfig) {
    await window.kairos!.setProvider(next);
    setProviderState(next);
  }

  async function handlePermissionResponse(approved: boolean) {
    if (!permissionRequest) return;
    const req = permissionRequest;
    setPermissionRequest(null);
    try {
      await window.kairos!.respondPermission(req.requestId, approved);
    } catch (err) {
      addSystemMessage(
        `Erro respondendo permissão: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-950">
          <div className="border-b border-slate-800 px-4 py-3">
            <button
              type="button"
              onClick={handleNewConversation}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
            >
              + Nova conversa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 italic">Nenhuma conversa</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex cursor-pointer items-center justify-between border-b border-slate-900 px-3 py-2 text-sm ${
                    c.id === sessionId ? "bg-slate-800" : "hover:bg-slate-900"
                  }`}
                  onClick={() => void handleSwitchConversation(c.id)}
                >
                  <div className="flex-1 truncate">
                    <p className="truncate">{c.title ?? "Sem título"}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteConversation(c.id);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-500 hover:text-red-400"
                    aria-label="Excluir"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
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
                onChange={(e) =>
                  handleProviderChange({ ...provider, provider: e.target.value as ProviderConfig["provider"] })
                }
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
                onChange={(e) =>
                  handleProviderChange({ ...provider, apiKey: e.target.value || undefined })
                }
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

      {/* Modal de permissão (Sprint 1.5) */}
      {permissionRequest && (
        <PermissionModal
          request={permissionRequest}
          onRespond={(approved) => void handlePermissionResponse(approved)}
        />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * Modal de confirmação para tools destrutivas (Sprint 1.5).
 *
 * Mostra:
 *   - Tool sendo chamada
 *   - Prompt amigável
 *   - Argumentos formatados em JSON
 *   - Botões Permitir (verde) / Negar (vermelho)
 *   - Esc = nega, Enter = aprova
 */
function PermissionModal({
  request,
  onRespond,
}: {
  request: PermissionRequest;
  onRespond: (approved: boolean) => void;
}) {
  // Esc = nega, Enter = aprova
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onRespond(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onRespond(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRespond]);

  const argsStr = (() => {
    try {
      return JSON.stringify(request.input, null, 2);
    } catch {
      return String(request.input);
    }
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perm-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
          </div>
          <div className="flex-1">
            <h2 id="perm-title" className="text-lg font-semibold text-slate-100">
              Ação requer confirmação
            </h2>
            <p className="mt-1 text-sm text-slate-400">{request.prompt}</p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-300">
              {request.tool}
            </span>
            <span className="text-slate-500">ID: {request.requestId}</span>
          </div>
          <p className="mb-1 text-xs font-semibold text-slate-400">Argumentos:</p>
          <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-300 font-mono">
            {argsStr}
          </pre>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onRespond(false)}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Negar (Esc)
          </button>
          <button
            type="button"
            onClick={() => onRespond(true)}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
            autoFocus
          >
            Permitir (Enter)
          </button>
        </div>
      </div>
    </div>
  );
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
