import { useState } from 'react'
import type { TaskPriority, TaskStatus } from '../types/task'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { CreateTaskModal } from '../components/CreateTaskModal'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: tasks, isLoading, isError, error, refetch } = useTasks(
    status || undefined,
    priority || undefined,
  )

  function clearFilters() {
    setStatus('')
    setPriority('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            + New Task
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {(status || priority) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-600 font-medium">Failed to load tasks</p>
            <p className="text-gray-500 text-sm">{(error as Error).message}</p>
            <button
              onClick={() => void refetch()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && tasks && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-4xl">📋</p>
            <p className="text-gray-700 font-medium text-lg">No tasks yet</p>
            <p className="text-gray-400 text-sm">
              {status || priority
                ? 'No tasks match the current filters. Try clearing them.'
                : 'Create your first task to get started.'}
            </p>
            {!status && !priority && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                + New Task
              </button>
            )}
          </div>
        )}

        {/* Task grid */}
        {!isLoading && !isError && tasks && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
