---
name: ci-cd
description: >
  Use this skill to create or modify GitHub Actions workflows, manage the release process,
  or set up branch protection. Invoke when adding a new CI job, fixing a failing workflow,
  changing the build matrix, or setting up automated deployments.
---

# Skill: ci-cd

Creates and maintains GitHub Actions workflows for the Task Manager API.
Every workflow change must be verified by a local dry-run or a real push to a feature branch.

---

## Step 1 — Understand the change

Confirm:

- Which event should trigger the workflow (`push`, `pull_request`, `workflow_dispatch`, `schedule`)
- Which branches are in scope (`main`, `develop`, feature branches)
- What jobs are needed (build, test, integration-test, deploy, release)
- Any secrets or environment variables required
- Whether Docker is available in the runner (needed for Testcontainers)

---

## Step 2 — Inspect existing workflows

```
LS    → .github/workflows/    (list existing workflow files)
Read  → .github/workflows/*.yml   (understand current pipeline)
```

---

## Step 3 — Workflow structure

### Standard CI build (`build.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Build and unit test
        run: ./gradlew clean build

      - name: Integration tests
        run: ./gradlew integrationTest
        # Testcontainers uses the Docker daemon provided by ubuntu-latest

      - name: Upload build artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: build/libs/*.jar
          retention-days: 7
```

### Rules

- Always pin action versions (`@v4`, not `@main`)
- Use `actions/setup-java@v4` with `cache: gradle` to speed up builds
- Run unit tests and integration tests as separate steps — easier to diagnose failures
- Upload the fat jar only on `main` — not on every PR
- Never put secrets in workflow YAML — use `${{ secrets.SECRET_NAME }}`
- Use `ubuntu-latest` — Docker is pre-installed (required for Testcontainers)

---

## Step 4 — Secrets and environment variables

Reference secrets from the GitHub repo settings:

```yaml
env:
  DB_URL: ${{ secrets.PROD_DB_URL }}
  DB_USER: ${{ secrets.PROD_DB_USER }}
  DB_PASS: ${{ secrets.PROD_DB_PASS }}
```

For integration tests, Testcontainers manages its own Docker containers — no DB secret needed.

---

## Step 5 — Branch protection (document only — set in GitHub UI)

Recommended settings for `main`:
- Require status checks: `build`
- Require branches to be up to date before merging
- Require at least 1 approving review
- No direct pushes

---

## Step 6 — Verify

```bash
# Check YAML syntax locally (requires actionlint if installed)
actionlint .github/workflows/build.yml

# Or push to a feature branch and watch the Actions tab on GitHub
gh run watch
```

---

## Output summary

```
## Workflow change
[what was added or modified]

## Trigger
[event and branch scope]

## Jobs
- [job name] — what it does

## Secrets required
- [name] — purpose

## Verify
gh run watch — monitor the triggered run
```
