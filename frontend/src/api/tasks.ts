import type { CreateTaskRequest, TaskPriority, TaskResponse, TaskStatus, UpdateTaskRequest, UpdateTaskStatusRequest } from '../types/task'

const BASE = '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getTasks(status?: TaskStatus, priority?: TaskPriority): Promise<TaskResponse[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (priority) params.set('priority', priority)
  const query = params.toString()
  const res = await fetch(`${BASE}/tasks${query ? `?${query}` : ''}`)
  return handleResponse<TaskResponse[]>(res)
}

export async function getTask(id: number): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}`)
  return handleResponse<TaskResponse>(res)
}

export async function createTask(body: CreateTaskRequest): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<TaskResponse>(res)
}

export async function updateTask(id: number, body: UpdateTaskRequest): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<TaskResponse>(res)
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
}

export async function addTag(id: number, tag: string): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag }),
  })
  return handleResponse<TaskResponse>(res)
}

export async function removeTag(id: number, tag: string): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  })
  return handleResponse<TaskResponse>(res)
}

export async function replaceTask(id: number, body: CreateTaskRequest): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<TaskResponse>(res)
}

export async function updateTaskStatus(id: number, body: UpdateTaskStatusRequest): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<TaskResponse>(res)
}
