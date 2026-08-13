/**
 * Permissions — gate de confirmação para tools destrutivas.
 *
 * Casa direto com a seção 16 e 28 do PRD.
 *
 * Sprint 1.5: hook injetável. O main process do Electron injeta um hook que
 * faz o roundtrip IPC até o renderer (modal bonito). Em outros runtimes
 * (CLI, testes), o hook pode ser omitido — neste caso, `confirm()` aprova
 * automaticamente (fallback dev-friendly).
 *
 * O fluxo:
 *   1. Loop detecta tool destrutiva
 *   2. Chama `await permissions.confirm({ tool, prompt, input })`
 *   3. Internamente, gera `requestId`, invoca o hook
 *   4. Hook (no Electron) manda IPC pro renderer e espera resposta
 *   5. Renderer exibe modal, user clica Permitir/Negar
 *   6. Renderer responde via IPC → main chama `resolve(requestId, approved)`
 *   7. `confirm()` resolve com `true` ou `false`
 *
 * Suporta múltiplas requests simultâneas (uma por tool em loops paralelos).
 */

export interface PermissionRequest {
  /** Identificador único da request (gerado por `confirm()`). */
  requestId: string;
  /** Nome da tool que está pedindo confirmação. */
  tool: string;
  /** Mensagem amigável exibida ao usuário. */
  prompt: string;
  /** Argumentos da tool (input cru do LLM). */
  input: unknown;
}

/**
 * Hook de transporte: recebe uma PermissionRequest e deve retornar uma
 * Promise que resolve quando o usuário responder (true = aprova, false = nega).
 *
 * No Electron, esse hook faz IPC roundtrip com o renderer.
 * Em outros runtimes, pode ser um `confirm()` nativo, um TTY prompt, etc.
 */
export type PermissionHook = (req: PermissionRequest) => Promise<boolean>;

interface PendingResolver {
  resolve: (approved: boolean) => void;
  reject: (err: Error) => void;
  tool: string;
}

const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export class Permissions {
  private aborted = false;
  private hook: PermissionHook | null = null;
  private readonly pending = new Map<string, PendingResolver>();
  private counter = 0;

  /**
   * Injeta o hook de transporte. Deve ser chamado uma vez no boot do host
   * (ex.: Electron main process). Se nenhum hook for injetado, `confirm()`
   * aprova automaticamente (modo dev/CLI).
   */
  setHook(hook: PermissionHook | null): void {
    this.hook = hook;
  }

  /**
   * Pede confirmação. Retorna `true` se aprovado, `false` se negado.
   * Se nenhum hook estiver injetado, aprova automaticamente.
   */
  async confirm(args: { tool: string; prompt: string; input: unknown }): Promise<boolean> {
    if (this.aborted) return false;

    // Sem hook → fallback dev (aprovação automática).
    if (!this.hook) return true;

    const requestId = this.nextId();
    const req: PermissionRequest = { requestId, ...args };

    return new Promise<boolean>((resolve, reject) => {
      const entry: PendingResolver = { resolve, reject, tool: args.tool };
      this.pending.set(requestId, entry);

      // Safety net: se hook pendurar por mais de REQUEST_TIMEOUT_MS, auto-nega.
      const timer = setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          resolve(false);
        }
      }, REQUEST_TIMEOUT_MS);

      // Dispara hook. Quando resolver (via `resolve()` ou hook.then), limpa timer.
      const cleanup = () => clearTimeout(timer);

      // Encapsula o resolve pra rodar o cleanup
      const wrappedResolve = (approved: boolean) => {
        cleanup();
        this.pending.delete(requestId);
        entry.resolve(approved);
      };
      entry.resolve = wrappedResolve;

      this.hook!(req)
        .then((approved) => {
          if (this.pending.has(requestId)) {
            wrappedResolve(approved);
          }
        })
        .catch((err) => {
          if (this.pending.has(requestId)) {
            cleanup();
            this.pending.delete(requestId);
            entry.reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
    });
  }

  /**
   * Resolve uma request pendente. Chamado pelo main process quando o
   * renderer responde via IPC. Idempotente: chamadas duplicadas são no-op.
   */
  resolve(requestId: string, approved: boolean): void {
    const r = this.pending.get(requestId);
    if (!r) return; // já resolvida, ou timeout
    r.resolve(approved);
  }

  /** Aborta a execução atual. Nega qualquer request pendente. */
  abort(): void {
    this.aborted = true;
    for (const [, r] of this.pending) {
      r.resolve(false);
    }
    this.pending.clear();
  }

  isAborted(): boolean {
    return this.aborted;
  }

  /** Reseta estado de abort (chamado no início de cada loop). */
  resetAbort(): void {
    this.aborted = false;
  }

  /** Quantidade de requests pendentes (apenas para debug). */
  pendingCount(): number {
    return this.pending.size;
  }

  private nextId(): string {
    this.counter += 1;
    return `perm-${Date.now().toString(36)}-${this.counter.toString(36)}`;
  }
}
