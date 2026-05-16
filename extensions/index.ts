/**
 * Git Commands Extension
 *
 * 注册 /git-commit [message] 和 /git-push [message] 命令。
 * 复用当前对话的模型分析 git diff，生成 Conventional Commits 格式的提交信息。
 *
 * 安装：
 *   本地：放到 ~/.pi/agent/extensions/git-commands/ 目录
 *   npm：  pi install npm:pi-git-commands
 *
 * 交互流程：LLM 生成 → 3 行预览 → 用户选择"使用"/"自定义"/"取消"
 *
 * 语言：
 *   默认英文。设环境变量 LANG=zh_CN 或在 ~/.pi/agent/settings.json 中
 *   加 "gitCommandsLanguage": "zh" 切换为中文。
 */

import { complete } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { getPrompt } from "./prompts";

// ── 获取待提交的 diff ─────────────────────────────────────────────
async function getDiff(pi: ExtensionAPI, cwd: string): Promise<string> {
  const { stdout } = await pi.exec(
    "git", ["diff", "--staged", "-p", "--unified=3"], { cwd }
  );
  if (!stdout.trim()) return "";
  return stdout.length > 8000 ? stdout.slice(0, 8000) + "\n... (truncated)" : stdout;
}

// ── 调用当前模型生成 commit message ──────────────────────────────
async function generateMessage(
  pi: ExtensionAPI, ctx: ExtensionCommandContext, cwd: string, forceLang?: string
): Promise<string> {
  const diff = await getDiff(pi, cwd);
  if (!diff) return "chore: update";

  const model = ctx.model;
  if (!model) return fallbackMessage(pi, cwd);

  try {
    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || !auth.apiKey) return fallbackMessage(pi, cwd);

    const prompt = getPrompt(forceLang);

    const response = await complete(
      model,
      {
        systemPrompt: prompt.systemPrompt,
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt.userTemplate(diff) }],
          timestamp: Date.now(),
        }],
      },
      { apiKey: auth.apiKey, headers: auth.headers },
    );

    if (response.stopReason === "aborted") return fallbackMessage(pi, cwd);

    const text = response.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map(c => c.text)
      .join("\n")
      .trim()
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/```\s*$/, "");

    if (text) return text;
  } catch {
    // 模型调用失败，回落
  }

  return fallbackMessage(pi, cwd);
}

// ── 回退：启发式生成 ──────────────────────────────────────────────
async function fallbackMessage(pi: ExtensionAPI, cwd: string): Promise<string> {
  const { stdout: statusOut } = await pi.exec(
    "git", ["diff", "--staged", "--name-status"], { cwd }
  );
  const lines = statusOut.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return "chore: update";

  const added: string[] = [], modified: string[] = [], deleted: string[] = [];
  for (const line of lines) {
    const parts = line.split("\t");
    const s = parts[0], f = parts[parts.length - 1];
    if (s.startsWith("A")) added.push(f);
    else if (s.startsWith("D")) deleted.push(f);
    else modified.push(f);
  }
  const allFiles = [...added, ...modified, ...deleted];
  const allPaths = allFiles.join(" ").toLowerCase();

  let type = "chore";
  if (allPaths.includes(".test.") || allPaths.includes("__tests__") || allPaths.includes(".spec.")) type = "test";
  else if (allPaths.includes("docs/") || allFiles.every(f => f.endsWith(".md"))) type = "docs";
  else if (deleted.length > 0 && added.length === 0 && modified.length === 0) type = "refactor";
  else if (modified.length > 0 && added.length === 0) type = "fix";
  else if (added.length > 0) type = "feat";

  let scope = "";
  const topDirs = new Set(allFiles.map(f => f.split("/")[0]));
  if (topDirs.size === 1 && [...topDirs][0] !== ".") scope = [...topDirs][0];
  else if (allFiles.every(f => f.startsWith("src/"))) {
    const sub = new Set(allFiles.map(f => f.split("/")[1]));
    if (sub.size === 1) scope = [...sub][0];
  }

  const labels: Record<string, string> = {
    feat: "add", fix: "fix", docs: "docs",
    refactor: "refactor", test: "test", chore: "chore",
  };
  const n = added.length + modified.length + deleted.length;
  const prefix = scope ? `${type}(${scope})` : type;
  const { stdout: stat } = await pi.exec("git", ["diff", "--staged", "--shortstat"], { cwd });
  return `${prefix}: ${labels[type]} (${n} files)\n\n${stat.trim()}`;
}

// ── 共享的 commit 交互流程 ───────────────────────────────────────
async function commitFlow(
  pi: ExtensionAPI, ctx: ExtensionCommandContext, cwd: string, args: string
): Promise<boolean> {
  const { stdout: st } = await pi.exec("git", ["status", "--porcelain"], { cwd });
  if (!st.trim()) {
    ctx.ui.notify("Nothing to commit", "info");
    return false;
  }

  await pi.exec("git", ["add", "."], { cwd });

  // 用户直接传了 message → 跳过 LLM
  let message = "";
  let forceLang = "";

  const raw = args?.trim();
  if (raw) {
    // 纯语言切换：/git-commit zh 或 /git-commit en
    if (raw === "zh" || raw === "en") {
      forceLang = raw;
    } else {
      // 用户传了自定义 message
      message = raw;
    }
  }

  if (!message) {
    ctx.ui.setStatus("git-commands", "Analyzing diff...");
    const generated = await generateMessage(pi, ctx, cwd, forceLang);
    ctx.ui.setStatus("git-commands", "");

    const preview = generated.split("\n").slice(0, 3).join("\n");
    const choice = await ctx.ui.select(preview, [
      "✓ Accept",
      "✏ Custom...",
      "✕ Cancel",
    ]);

    if (!choice || choice.includes("Cancel")) {
      ctx.ui.notify("Commit cancelled", "warning");
      return false;
    }

    message = generated;
    if (choice.includes("Custom")) {
      const custom = await ctx.ui.input("Enter commit message");
      if (custom?.trim()) message = custom.trim();
    }
  }

  try {
    const { stdout, stderr } = await pi.exec("git", ["commit", "-m", message], { cwd });
    ctx.ui.notify(stderr || stdout || "Committed", "success");
    return true;
  } catch (err: any) {
    ctx.ui.notify(`Commit failed: ${err.message || err}`, "error");
    return false;
  }
}

type TagAction = "add" | "delete" | "list" | "";

interface TagOptions {
  action: TagAction;
  tag: string;
  message: string;
  push: boolean;
  remote: boolean;
  all: boolean;
  remoteName: string;
  invalid?: string;
}

// ── 解析 /git-tag 参数 ───────────────────────────────────────────
function splitArgs(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | "" = "";
  let escaping = false;

  for (const ch of input || "") {
    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escaping = true;
      continue;
    }
    if ((ch === '"' || ch === "'") && (!quote || quote === ch)) {
      quote = quote ? "" : ch;
      continue;
    }
    if (/\s/.test(ch) && !quote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }

  if (current) tokens.push(current);
  return tokens;
}

function parseTagArgs(args: string): TagOptions {
  const tokens = splitArgs(args?.trim() || "");
  const action = (tokens.shift() || "") as TagAction;
  const opts: TagOptions = {
    action,
    tag: "",
    message: "",
    push: false,
    remote: false,
    all: false,
    remoteName: "origin",
  };

  if (action && !["add", "delete", "list"].includes(action)) {
    opts.invalid = `Unknown action: ${action}`;
    return opts;
  }

  const positional: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "--push") opts.push = true;
    else if (token === "--remote") opts.remote = true;
    else if (token === "--all") opts.all = true;
    else if (token === "--remote-name") {
      const name = tokens[++i];
      if (!name || name.startsWith("--")) {
        opts.invalid = "Missing value for --remote-name";
        return opts;
      }
      opts.remoteName = name;
    } else if (token.startsWith("--")) {
      opts.invalid = `Unknown flag: ${token}`;
      return opts;
    } else {
      positional.push(token);
    }
  }

  opts.tag = positional.shift() || "";
  opts.message = positional.join(" ").trim();
  return opts;
}

// ── /git-tag 用法 ────────────────────────────────────────────────
function showTagUsage(ctx: ExtensionCommandContext) {
  ctx.ui.notify([
    "Usage:",
    "/git-tag add <tag> [message...] [--push] [--remote-name <name>]",
    "/git-tag delete <tag> [--remote] [--all] [--remote-name <name>]",
    "/git-tag list",
  ].join("\n"), "warning");
}

// ── 新增 tag ────────────────────────────────────────────────────
async function createTag(
  pi: ExtensionAPI, ctx: ExtensionCommandContext, cwd: string, opts: TagOptions
) {
  if (!opts.tag) {
    showTagUsage(ctx);
    return;
  }

  let message = opts.message;
  if (!message) {
    const input = await ctx.ui.input(`Enter tag message for ${opts.tag}`);
    message = input?.trim() || opts.tag;
  }

  try {
    const { stdout, stderr } = await pi.exec("git", ["tag", "-a", opts.tag, "-m", message], { cwd });
    const tagOutput = (stderr || stdout || `Created tag ${opts.tag}`).trim();

    if (opts.push) {
      ctx.ui.setStatus("git-commands", `Pushing tag ${opts.tag}...`);
      const pushed = await pi.exec("git", ["push", opts.remoteName, opts.tag], { cwd });
      ctx.ui.setStatus("git-commands", "");
      ctx.ui.notify([tagOutput, pushed.stderr || pushed.stdout || `Pushed tag ${opts.tag} to ${opts.remoteName}`]
        .filter(Boolean).join("\n"), "success");
      return;
    }

    ctx.ui.notify(tagOutput, "success");
  } catch (err: any) {
    ctx.ui.setStatus("git-commands", "");
    ctx.ui.notify(`Tag create failed: ${err.message || err}`, "error");
  }
}

// ── 删除 tag ────────────────────────────────────────────────────
async function deleteTag(
  pi: ExtensionAPI, ctx: ExtensionCommandContext, cwd: string, opts: TagOptions
) {
  if (!opts.tag) {
    showTagUsage(ctx);
    return;
  }

  const deleteLocal = !opts.remote || opts.all;
  const deleteRemote = opts.remote || opts.all;
  const messages: string[] = [];

  try {
    if (deleteLocal) {
      const { stdout, stderr } = await pi.exec("git", ["tag", "-d", opts.tag], { cwd });
      messages.push((stderr || stdout || `Deleted local tag ${opts.tag}`).trim());
    }

    if (deleteRemote) {
      const choice = await ctx.ui.select(
        `Delete remote tag ${opts.tag} from ${opts.remoteName}?`,
        ["✓ Delete remote tag", "✕ Cancel"]
      );
      if (!choice || choice.includes("Cancel")) {
        messages.push("Remote tag delete cancelled");
        ctx.ui.notify(messages.filter(Boolean).join("\n"), "warning");
        return;
      }

      ctx.ui.setStatus("git-commands", `Deleting remote tag ${opts.tag}...`);
      const { stdout, stderr } = await pi.exec(
        "git", ["push", opts.remoteName, `:refs/tags/${opts.tag}`], { cwd }
      );
      ctx.ui.setStatus("git-commands", "");
      messages.push((stderr || stdout || `Deleted remote tag ${opts.tag} from ${opts.remoteName}`).trim());
    }

    ctx.ui.notify(messages.filter(Boolean).join("\n") || `Deleted tag ${opts.tag}`, "success");
  } catch (err: any) {
    ctx.ui.setStatus("git-commands", "");
    ctx.ui.notify(`Tag delete failed: ${err.message || err}`, "error");
  }
}

// ── 列出 tag ────────────────────────────────────────────────────
async function listTags(pi: ExtensionAPI, ctx: ExtensionCommandContext, cwd: string) {
  try {
    const { stdout } = await pi.exec("git", ["tag", "--list"], { cwd });
    ctx.ui.notify(stdout.trim() || "No tags", "info");
  } catch (err: any) {
    ctx.ui.notify(`Tag list failed: ${err.message || err}`, "error");
  }
}

// ── 清理旧单文件扩展（如存在） ──────────────────────────────────
async function cleanupOldFile() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const oldFile = path.join(
    process.env.HOME || "~",
    ".pi/agent/extensions/git-commands.ts"
  );
  if (fs.existsSync(oldFile)) {
    fs.unlinkSync(oldFile);
    console.log("[git-commands] removed old single-file extension");
  }
}

// ── 扩展入口 ──────────────────────────────────────────────────────
export default async function (pi: ExtensionAPI) {
  await cleanupOldFile();

  pi.registerCommand("git-commit", {
    description: "Stage all changes and commit (LLM generates commit message)",
    handler: async (args, ctx) => {
      await commitFlow(pi, ctx, ctx.cwd, args);
    },
  });

  pi.registerCommand("git-push", {
    description: "Stage all changes, commit, and push",
    handler: async (args, ctx) => {
      const committed = await commitFlow(pi, ctx, ctx.cwd, args);
      if (!committed) {
        const { stdout: st } = await pi.exec("git", ["status", "--porcelain"], { cwd: ctx.cwd });
        if (!st.trim()) { /* no changes, just push */ }
        else return;
      }

      try {
        ctx.ui.setStatus("git-commands", "Pushing...");
        const { stdout, stderr } = await pi.exec("git", ["push"], { cwd: ctx.cwd });
        ctx.ui.setStatus("git-commands", "");
        ctx.ui.notify(stderr || stdout || "Push successful", "success");
      } catch (err: any) {
        ctx.ui.setStatus("git-commands", "");
        ctx.ui.notify(`Push failed: ${err.message || err}`, "error");
      }
    },
  });

  pi.registerCommand("git-tag", {
    description: "Create, delete, and list git tags",
    handler: async (args, ctx) => {
      const opts = parseTagArgs(args);
      if (opts.invalid || !opts.action) {
        if (opts.invalid) ctx.ui.notify(opts.invalid, "warning");
        showTagUsage(ctx);
        return;
      }

      if (opts.action === "add") await createTag(pi, ctx, ctx.cwd, opts);
      else if (opts.action === "delete") await deleteTag(pi, ctx, ctx.cwd, opts);
      else if (opts.action === "list") await listTags(pi, ctx, ctx.cwd);
      else showTagUsage(ctx);
    },
  });
}
