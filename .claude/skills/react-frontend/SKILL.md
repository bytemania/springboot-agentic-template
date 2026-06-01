---
name: react-frontend
description: >
  Build, extend, or sync the React frontend module for this Task Manager project.
  Use when scaffolding the frontend/, adding a new page or component for a new API endpoint,
  updating TypeScript types after a backend change, or wiring TanStack Query hooks to new endpoints.
---

# React Frontend Skill

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (utility-first styling)
- React Router v6 (routing)
- TanStack Query v5 (server state — no Redux)
- Native `fetch` via Vite proxy (no axios)

## Project layout

```
frontend/
├── src/
│   ├── api/          # one file per domain (tasks.ts, etc.)
│   ├── components/   # reusable UI (Button, Badge, Modal, etc.)
│   ├── pages/        # page-level components (TasksPage, etc.)
│   ├── hooks/        # TanStack Query hooks (useTasks, useCreateTask, etc.)
│   ├── types/        # TypeScript interfaces mirroring Java DTOs
│   └── main.tsx
├── vite.config.ts    # proxy: /api → http://localhost:8080
└── package.json
```

## Step 1 — Scaffold (only if frontend/ does not exist)

```bash
cd /Users/sergio/CoworkSandbox/springboot-agentic-template
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
npm install @tanstack/react-query react-router-dom
```

`vite.config.ts` proxy — add inside `defineConfig`:
```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') }
  }
}
```

`tailwind.config.ts` content paths:
```ts
content: ['./index.html', './src/**/*.{ts,tsx}']
```

## Step 2 — Mirror backend DTOs as TypeScript types

Read the Java DTO records in `src/main/java/**/dto/` and mirror them exactly.

```ts
// src/types/task.ts
export interface TaskResponse {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: string
}
export interface CreateTaskRequest {
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

Rules:
- `Long` → `number`, `String` → `string`, `LocalDateTime` → `string`
- Java enums → TypeScript string unions
- Nullable fields → `field?: Type` or `field: Type | null`

## Step 3 — Write API wrappers

One file per domain under `src/api/`. Always use the `/api` proxy prefix.

```ts
// src/api/tasks.ts
const BASE = '/api'

export async function getTasks(): Promise<TaskResponse[]> {
  const res = await fetch(`${BASE}/tasks`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createTask(body: CreateTaskRequest): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

## Step 4 — TanStack Query hooks

```ts
// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask } from '../api/tasks'

export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: getTasks })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
```

## Step 5 — Pages and components

- One `Page` component per domain (e.g. `TasksPage.tsx`)
- Small reusable components in `components/` (e.g. `TaskCard`, `PriorityBadge`, `StatusBadge`)
- Use Tailwind for all styling — no inline styles, no CSS modules
- Design quality: use proper spacing, colour, typography — not a grey-box prototype

## Step 6 — Verify

```bash
cd frontend && npm run build   # must compile with zero TypeScript errors
npm run dev                    # manual smoke test at http://localhost:5173
```

Spring Boot must be running on port 8080.

## When adding a new endpoint (post feature-end-to-end workflow)

1. Read the new controller and DTO classes.
2. Add TypeScript interface to `src/types/`.
3. Add API wrapper to `src/api/`.
4. Add TanStack Query hook to `src/hooks/`.
5. Add or update the relevant Page component.
6. Run `npm run build` — fix all TypeScript errors.

## Never do this

- Call `http://localhost:8080` directly — always use the `/api` proxy.
- Assume a backend endpoint exists without reading the controller source.
- Use class components.
- Add state management libraries without justification.
- Leave TypeScript errors unfixed.
