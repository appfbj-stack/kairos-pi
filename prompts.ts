/**
 * Git Commands — 提示词
 *
 * 语言：英文（默认）/ 中文
 * 优先级：settings.json > LANG 环境变量 > 默认英文
 */

export interface CommitPrompt {
  systemPrompt: string;
  userTemplate: (diff: string) => string;
}

const EN: CommitPrompt = {
  systemPrompt:
    "Generate a Conventional Commits message from the git diff. Use ONLY English. Output only the message.",
  userTemplate: (diff: string) => [
    "Generate a commit message in ENGLISH. Rules:",
    "- Format: <type>(<scope>): <description>",
    "- type: feat/fix/docs/refactor/test/chore/style",
    "- scope: directory name (English only, no Chinese)",
    "- description: concise imperative mood, one line, English only",
    "- NO Chinese characters anywhere",
    "- No explanations, quotes, or code blocks",
    "",
    diff,
  ].join("\n"),
};

const ZH: CommitPrompt = {
  systemPrompt:
    "你根据 git diff 输出 Conventional Commits 格式的提交信息。只输出信息本身，不要任何其他内容。",
  userTemplate: (diff: string) => [
    "生成提交信息。规则：",
    "- 格式: <type>(<scope>): <中文描述>",
    "- type: feat/fix/docs/refactor/test/chore/style",
    "- scope: 英文目录名，无则省略括号",
    "- 描述: 简洁中文，一行",
    "- 不要解释、引号、代码块",
    "",
    diff,
  ].join("\n"),
};

/**
 * 语言选择
 * 优先：forceLang 参数 → settings.gitCommandsLanguage → GIT_COMMANDS_LANG → 默认 en
 */
export function getPrompt(forceLang?: string): CommitPrompt {
  const lang = forceLang
    || (() => {
        try {
          const fs = require("node:fs");
          const path = require("node:path");
          const settingsPath = path.join(process.env.HOME || "~", ".pi/agent/settings.json");
          if (fs.existsSync(settingsPath)) {
            const s = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
            if (s.gitCommandsLanguage) return s.gitCommandsLanguage;
          }
        } catch {}
        return process.env.GIT_COMMANDS_LANG || "en";
      })();

  return lang === "zh" ? ZH : EN;
}
