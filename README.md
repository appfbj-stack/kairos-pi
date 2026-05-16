# pi-git-commands

Pi agent extension that registers `/git-commit`, `/git-push`, and `/git-tag` commands.

It reuses the current conversation model to analyze `git diff` and generate [Conventional Commits](https://www.conventionalcommits.org/) messages. It also supports Git tag creation, deletion, and listing.

## Installation

```bash
# npm
pi install npm:pi-git-commands

# GitHub
pi install git:github.com/helloHupc/pi-git-commands
```

Or install manually:

```bash
mkdir -p ~/.pi/agent/extensions/git-commands
cp extensions/*.ts ~/.pi/agent/extensions/git-commands/
```

Run `/reload` after installation.

## Usage

### `/git-commit`

```
/git-commit              Generate an English commit message with LLM
/git-commit zh            Generate a Chinese commit message with LLM
/git-commit fix: typo    Commit directly with a custom message
```

Flow:

1. Run `git add .` to stage all changes.
2. Analyze staged diff with LLM and generate a commit message. Status bar shows `Analyzing diff...`.
3. Show first 3 lines as preview.
4. Choose an action:

   ```
   feat(auth): add login page

   → ✓ Accept
     ✏ Custom...
     ✕ Cancel
   ```

   - **Accept** — commit with generated message.
   - **Custom** — open input box for a custom message.
   - **Cancel** — cancel commit.

### `/git-push`

```
/git-push              Same as /git-commit, then run git push
/git-push zh            Chinese mode, then push
/git-push deploy: v1.2  Custom message, then push
```

### `/git-tag`

```
/git-tag add <tag> [message...] [--push] [--remote-name <name>]
/git-tag push <tag> [--remote-name <name>]
/git-tag delete <tag> [--remote] [--all] [--remote-name <name>]
/git-tag list
```

Examples:

```
/git-tag add v1.2.0 "release v1.2.0"
/git-tag add v1.2.0 "release v1.2.0" --push
/git-tag push v1.2.0
/git-tag push v1.2.0 --remote-name upstream
/git-tag delete v1.2.0
/git-tag delete v1.2.0 --remote
/git-tag delete v1.2.0 --all --remote-name upstream
/git-tag list
```

Behavior:

- `add` creates an annotated tag by default: `git tag -a <tag> -m <message>`.
- If `add` has no message, an input box is shown. If still empty, the tag name is used as the message.
- `--push` pushes the tag immediately after creation. Default remote is `origin`.
- `push` pushes an existing local tag to the selected remote.
- `delete` deletes only the local tag by default.
- `--remote` deletes only the remote tag. `--all` deletes both local and remote tags.
- Remote tag deletion requires confirmation.
- `--remote-name <name>` selects a remote, for example `upstream`.

## Language

Default language is **English**. Switch to Chinese:

```bash
# Environment variable, one-shot
GIT_COMMANDS_LANG=zh

# Or persistent config: ~/.pi/agent/settings.json
{
  "gitCommandsLanguage": "zh"
}
```

Or switch per command: `/git-commit zh`.

## Fallback

If LLM is unavailable, the extension falls back to heuristic message generation based on changed file types and directories.

## File structure

```
~/.pi/agent/extensions/git-commands/
├── index.ts       # Command registration, LLM calls, interactive flow, tag operations
└── prompts.ts     # English/Chinese prompt templates
```

## Requirements

- Pi agent ≥ 0.73
- Configured model provider. The extension reuses the current conversation model and API key.
