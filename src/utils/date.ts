import type { CareTask, DueStatus } from '../types/care-task'

export function getDueStatus(task: CareTask, now: Date = new Date()): DueStatus {
  if (task.status === 'completed') return 'completed'

  const [year, month, day] = task.dueDate.split('-').map(Number)
  const dueDay = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const difference = dueDay.getTime() - today.getTime()

  if (difference < 0) return 'overdue'
  if (difference === 0) return 'due-today'
  return 'upcoming'
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(year, month - 1, day))
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
