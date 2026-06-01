import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/tasks'
import type { CreateTaskRequest, TaskPriority, TaskStatus, UpdateTaskRequest, UpdateTaskStatusRequest } from '../types/task'

export function useTasks(status?: TaskStatus, priority?: TaskPriority) {
  return useQuery({
    queryKey: ['tasks', { status, priority }],
    queryFn: () => api.getTasks(status, priority),
  })
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.getTask(id),
    enabled: id > 0,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTaskRequest) => api.createTask(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTaskRequest }) =>
      api.updateTask(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAddTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tag }: { id: number; tag: string }) => api.addTag(id, tag),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useRemoveTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tag }: { id: number; tag: string }) => api.removeTag(id, tag),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useReplaceTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CreateTaskRequest }) =>
      api.replaceTask(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
    },
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTaskStatusRequest }) =>
      api.updateTaskStatus(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
    },
  })
}
