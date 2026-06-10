---
trigger: github-code-review
description: Run a full GitHub PR code review using the GitHub MCP server and github-reviewer agent
---

## What this skill does

Reviews a GitHub Pull Request using the **GitHub MCP server** (`github` MCP tool) and the `github-reviewer` agent.

It fetches the PR metadata, diff, and changed files directly from the GitHub API, runs the full reviewer checklist, and **posts the review back to GitHub as an official PR review with inline comments**.

Covers: Java 21, Spring Boot 3 architecture, REST API design, JPA/Flyway, tests, security (OWASP), Micrometer observability, Gradle, Docker, CI.

## Prerequisites

- `.mcp.json` must have the `github` MCP server configured (already done).
- `.env` must contain a valid `GITHUB_TOKEN` with `repo` and `pull_requests` scopes.
- A PR must exist on GitHub for the current branch.

## Steps

1. Read `CLAUDE.md` to load architecture rules and project conventions.

2. Detect the repository and PR:
   - Run `git remote get-url origin` to get the repo (e.g. `bytemania/springboot-agentic-template`).
   - Run `git branch --show-current` to get the branch name.
   - Use MCP tool `list_pull_requests` filtered by `head` branch to find the open PR number.

3. Fetch PR details via MCP:
   - Call `get_pull_request` to get the PR title, description, and author.
   - Call `list_pull_request_files` to get the list of changed files.
   - Call `get_pull_request_diff` (or fall back to `git diff main...HEAD`) to get the full unified diff.

4. If the diff exceeds 400 lines, warn: "This PR is large — consider splitting it. Proceeding with full review."

5. Invoke the `github-reviewer` agent with:
   - The PR title and description
   - The full diff
   - The list of changed files
   - Instruction: "Apply your full checklist. For each finding include the exact file path and line number from the diff."

6. Post the review back to GitHub via MCP:
   - Use `create_pull_request_review` with `event: REQUEST_CHANGES` if there are BLOCKERs, `COMMENT` otherwise.
   - For each BLOCKER and MAJOR finding that has a specific file + line, also call `add_pull_request_review_comment` to post an inline comment.

7. Print the full review to the console so the user can see it locally too.

## Usage

```
/github-code-review
```

To review a specific PR number:
```
/github-code-review 42
```

## MCP tools used

| Tool | Purpose |
|---|---|
| `list_pull_requests` | Find the open PR for the current branch |
| `get_pull_request` | Fetch PR metadata (title, description, author) |
| `list_pull_request_files` | Get the list of changed files |
| `create_pull_request_review` | Post the review to GitHub |
| `add_pull_request_review_comment` | Post inline comments on specific lines |

## Agent used

- `github-reviewer` (defined in `.claude/agents/github-reviewer.md`)

## Output format

**Summary** — What the PR does and overall quality signal.

**Findings** — Severity-labelled list:
- `🔴 BLOCKER` — Must fix before merge. Posted as inline GitHub comment.
- `🟠 MAJOR` — Should fix. Posted as inline GitHub comment.
- `🟡 MINOR` — Code quality issue, not a merge blocker.
- `🔵 NIT` — Optional polish.
- `✅ GOOD` — Something done well.

Each finding: file path + line number, description, concrete fix.

**Missing Tests** — Untested behaviours with suggested test type.

**GitHub Review Posted** — Confirmation that the review was submitted to the PR.
