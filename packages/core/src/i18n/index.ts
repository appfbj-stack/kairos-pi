/**
 * i18n setup — i18next com PT-BR como default.
 *
 * Toda string da UI passa por aqui. Nenhum literal hardcoded em componente.
 */

import i18next from "i18next";

export async function initI18n(locale = "pt-BR"): Promise<typeof i18next> {
  // Sprint 1 carrega resources de arquivo JSON. Por enquanto, inline.
  const resources = {
    "pt-BR": {
      translation: {
        app: {
          title: "Kairós Desktop Alves",
          inputPlaceholder: "O que você quer fazer?",
        },
        actions: {
          send: "Enviar",
          attach: "Anexar arquivo",
          stop: "Parar execução",
          settings: "Configurações",
        },
        status: {
          thinking: "Kairos está pensando...",
          working: "Kairos está trabalhando...",
          done: "Tarefa concluída.",
          error: "Erro",
        },
        confirm: {
          destructiveAction: "Esta ação é destrutiva. Deseja continuar?",
          yes: "Continuar",
          no: "Cancelar",
        },
      },
    },
  };

  await i18next.init({
    resources,
    lng: locale,
    fallbackLng: "pt-BR",
    interpolation: { escapeValue: false },
  });

  return i18next;
}
