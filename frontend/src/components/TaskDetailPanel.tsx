import { useState } from 'react'
import type { TaskResponse } from '../types/task'
import { useDeleteTask, useTask } from '../hooks/useTasks'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { TagBadge } from './TagBadge'
import { EditTaskModal } from './EditTaskModal'

interface TaskDetailPanelProps {
  taskId: number
  onClose: () => void
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const { data: task, isLoading, isError } = useTask(taskId)
  const [showEdit, setShowEdit] = useState(false)
  const deleteTask = useDeleteTask()

  function handleDelete(t: TaskResponse) {
    if (window.confirm(`Delete "${t.title}"?`)) {
      deleteTask.mutate(t.id, { onSuccess: onClose })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-30 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          )}

          {isError && (
            <p className="text-red-600 text-sm">Failed to load task.</p>
          )}

          {task && (
            <div className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug">{task.title}</h3>
                {task.description && (
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4">
                {task.dueDate && (
                  <DetailRow label="Due Date">
                    {task.dueDate}
                  </DetailRow>
                )}
                <DetailRow label="Created">
                  {formatDateTime(task.createdAt)}
                </DetailRow>
                <DetailRow label="Updated">
                  {formatDateTime(task.updatedAt)}
                </DetailRow>
                <DetailRow label="ID">#{task.id}</DetailRow>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <DetailRow label="Tags">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                </DetailRow>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {task && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(task)}
              disabled={deleteTask.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {showEdit && task && (
        <EditTaskModal task={task} onClose={() => setShowEdit(false)} />
      )}
    </>
  )
}
