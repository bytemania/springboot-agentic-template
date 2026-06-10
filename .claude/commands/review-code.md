---
description: "Run a full GitHub PR code review via the GitHub MCP server — fetches diff from GitHub, reviews with github-reviewer agent, posts inline comments back to the PR"
---

1. Read `CLAUDE.md` to load architecture rules and conventions.

2. Detect the repository and PR:
   - Run `git remote get-url origin` to identify the repo (owner/name).
   - Run `git branch --show-current` to get the current branch.
   - Use the `github` MCP tool `list_pull_requests` with `state: open` and `head: <branch>` to find the PR number. If no open PR exists, fall back to `git diff main...HEAD` for a local-only review and skip the GitHub posting steps.

3. Fetch from GitHub via the `github` MCP server:
   - `get_pull_request` → PR title, description, author, base branch.
   - `list_pull_request_files` → list of changed files and patch hunks.

4. Get the full diff — try `get_pull_request_diff` via MCP first; fall back to `git diff main...HEAD` if unavailable.

5. If the diff exceeds 400 lines, warn: "This PR is large. Consider splitting it. Proceeding anyway."

6. Pass to the `github-reviewer` agent:
   - PR title and description
   - Full diff
   - Changed file list
   - Instruction: "Apply your full checklist. For every BLOCKER and MAJOR finding, include the exact file path and line number so it can be posted as an inline GitHub comment."

7. Post the review to GitHub via MCP:
   - Call `create_pull_request_review` with:
     - `event: REQUEST_CHANGES` if any BLOCKER findings exist, otherwise `COMMENT`.
     - `body`: the Summary paragraph from the review.
   - For each BLOCKER and MAJOR finding with a specific file + line number, call `add_pull_request_review_comment` with the finding text and suggested fix.

8. Print the complete review output to the console.

9. Confirm: "✅ Review posted to GitHub PR #<number>: <PR title>"
