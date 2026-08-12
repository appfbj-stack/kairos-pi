/**
 * Permissions — gate de confirmação para tools destrutivas.
 *
 * Casa direto com a seção 16 e 28 do PRD.
 *
 * A integração real com `pi-nolo` (do catálogo Pi) acontece na Sprint 1.
 * Por enquanto, stub que apenas tracka estado de abort.
 */

export class Permissions {
  private aborted = false;

  /**
   * Pede confirmação ao usuário antes de tool destrutiva.
   * Stub da Sprint 0 — implementação real na Sprint 1 com IPC + UI popup.
   */
  async confirm(_prompt: string): Promise<boolean> {
    // Sprint 1: envia IPC pro renderer, espera resposta do usuário.
    return true;
  }

  abort(): void {
    this.aborted = true;
  }

  isAborted(): boolean {
    return this.aborted;
  }
}
