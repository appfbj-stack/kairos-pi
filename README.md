# pi-git-commands

Pi agent 扩展，注册 `/git-commit` 和 `/git-push` 命令。

复用当前对话的 LLM 分析 `git diff`，自动生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息。

## 安装

```bash
# npm
pi install npm:pi-git-commands

# GitHub
pi install git:github.com/helloHupc/pi-git-commands
```

或手动放本地：

```bash
mkdir -p ~/.pi/agent/extensions/git-commands
cp extensions/*.ts ~/.pi/agent/extensions/git-commands/
```

安装后 `/reload` 加载。

## 用法

### `/git-commit`

```
/git-commit              默认英文 LLM 生成
/git-commit zh            中文 LLM 生成
/git-commit fix: typo    使用自定义 message 直接提交
```

交互流程：

1. `git add .` 暂存所有改动
2. LLM 分析 diff 生成提交信息（底部状态栏显示"Analyzing diff..."）
3. 展示前 3 行预览
4. 选择：

   ```
   feat(auth): add login page

   → ✓ Accept
     ✏ Custom...
     ✕ Cancel
   ```

   - **Accept** — 使用生成的 message 提交
   - **Custom** — 弹出输入框自定义
   - **Cancel** — 取消

### `/git-push`

```
/git-push              同上 + 自动 git push
/git-push zh            中文模式 + push
/git-push deploy: v1.2  自定义 message + push
```

## 语言

默认**英文**。切中文：

```bash
# 环境变量（单次生效）
GIT_COMMANDS_LANG=zh

# 或永久设置：~/.pi/agent/settings.json
{
  "gitCommandsLanguage": "zh"
}
```

或在命令中临时切换：`/git-commit zh`。

## 回退

LLM 不可用时，自动回退到启发式生成（基于文件变更类型和目录推断 type/scope）。

## 文件结构

```
~/.pi/agent/extensions/git-commands/
├── index.ts       # 命令注册、LLM 调用、交互流程
└── prompts.ts     # 中/英文提示词模板
```

## 要求

- Pi agent ≥ 0.73
- 已配置模型 Provider（复用当前对话的模型和 API key）
