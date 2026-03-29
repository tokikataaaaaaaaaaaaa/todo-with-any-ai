import { ClipboardList } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ClipboardList className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        No todos yet
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Create your first todo to get started.
      </p>
    </div>
  )
}
