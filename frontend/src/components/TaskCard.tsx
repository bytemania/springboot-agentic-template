import { useState } from 'react'
import type { TaskResponse } from '../types/task'
import { useDeleteTask } from '../hooks/useTasks'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { TagBadge } from './TagBadge'
import { EditTaskModal } from './EditTaskModal'
import { TaskDetailPanel } from './TaskDetailPanel'

interface TaskCardProps {
  task: TaskResponse
}

export function TaskCard({ task }: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const deleteTask = useDeleteTask()

  function handleDelete() {
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask.mutate(task.id)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-gray-900 text-sm leading-snug flex-1 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setShowDetail(true)}
          >{task.title}</h3>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors text-xs px-1.5 py-1 rounded hover:bg-blue-50"
              aria-label="Edit task"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="text-gray-400 hover:text-red-600 transition-colors text-xs px-1.5 py-1 rounded hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete task"
            >
              Delete
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-gray-500 text-xs line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 items-center">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>

        {task.dueDate && (
          <p className="text-xs text-gray-400">
            Due: <span className="text-gray-600">{task.dueDate}</span>
          </p>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <EditTaskModal task={task} onClose={() => setShowEdit(false)} />
      )}

      {showDetail && (
        <TaskDetailPanel taskId={task.id} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
