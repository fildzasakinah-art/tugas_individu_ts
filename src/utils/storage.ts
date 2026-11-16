import { isCareCategory, type CareTask } from '../types/care-task'

const STORAGE_KEY = 'pet-care-log.tasks.v1'

function isCareTask(value: unknown): value is CareTask {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.petName === 'string' &&
    typeof task.category === 'string' &&
    isCareCategory(task.category) &&
    typeof task.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
    typeof task.dueTime === 'string' &&
    /^\d{2}:\d{2}$/.test(task.dueTime) &&
    typeof task.notes === 'string' &&
    (task.status === 'pending' || task.status === 'completed') &&
    typeof task.createdAt === 'string' &&
    (typeof task.completedAt === 'string' || task.completedAt === null)
  )
}

export async function readTasks(): Promise<CareTask[] | null> {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null

  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed) || !parsed.every(isCareTask)) {
    throw new Error('Data perawatan tersimpan tidak valid. Hapus data browser untuk memulai ulang.')
  }
  return parsed
}

export async function writeTasks(tasks: CareTask[]): Promise<void> {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
