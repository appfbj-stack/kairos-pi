/**
 * Kairós Desktop Alves — chat UI minimalista.
 *
 * PRD §3: "A tela principal deve ser praticamente um chat."
 * Sprint 0: esqueleto estático com placeholder + indicador.
 * Sprint 1: integra com `window.kairos` (preload) pra mandar mensagem.
 */

import { useEffect, useState } from "react";

interface PingResult {
  ok: boolean;
  app: string;
  version: string;
}

export function App() {
  const [ping, setPing] = useState<PingResult | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    // Prova que a ponte Electron ↔ Renderer funciona.
    void window.kairos?.ping().then(setPing);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Kairós Desktop Alves</h1>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Configurações"
        >
          ⚙️
        </button>
      </header>

      {/* Conversation area */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        {ping ? (
          <div className="mx-auto max-w-2xl text-center text-slate-400">
            <p className="text-2xl">O que você quer que eu faça?</p>
            <p className="mt-2 text-sm">
              {ping.app} v{ping.version} — pronto pra começar.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl text-center text-slate-500">
            <p>Conectando...</p>
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="border-t border-slate-800 px-6 py-4">
        <form
          className="mx-auto flex max-w-2xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            // Sprint 1: enviar via window.kairos.send(draft).
            setDraft("");
          }}
        >
          <button
            type="button"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Anexar arquivo"
            title="Anexar arquivo"
          >
            📎
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="O que você quer fazer?"
            className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
            disabled={!draft.trim()}
          >
            ➤
          </button>
        </form>
      </footer>
    </div>
  );
}
