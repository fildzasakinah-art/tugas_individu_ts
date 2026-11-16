import type { CareTask, CareTaskInput } from '../types/care-task'
import { readTasks, writeTasks } from '../utils/storage'

function createId(): string {
  return crypto.randomUUID()
}

export async function listCareTasks(): Promise<CareTask[]> {
  return (await readTasks()) ?? []
}

export async function createCareTask(input: CareTaskInput): Promise<CareTask> {
  const tasks = await listCareTasks()
  const task: CareTask = {
    ...input,
    id: createId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
  }
  await writeTasks([task, ...tasks])
  return task
}

export async function updateCareTask(id: string, input: CareTaskInput): Promise<CareTask> {
  const tasks = await listCareTasks()
  const existing = tasks.find((task) => task.id === id)
  if (!existing) throw new Error('Jadwal tidak ditemukan.')

  const updated: CareTask = { ...existing, ...input }
  await writeTasks(tasks.map((task) => (task.id === id ? updated : task)))
  return updated
}

export async function toggleCareTaskCompletion(id: string): Promise<CareTask> {
  const tasks = await listCareTasks()
  const existing = tasks.find((task) => task.id === id)
  if (!existing) throw new Error('Jadwal tidak ditemukan.')

  const updated: CareTask = {
    ...existing,
    status: existing.status === 'completed' ? 'pending' : 'completed',
    completedAt: existing.status === 'completed' ? null : new Date().toISOString(),
  }
  await writeTasks(tasks.map((task) => (task.id === id ? updated : task)))
  return updated
}

export async function deleteCareTask(id: string): Promise<void> {
  const tasks = await listCareTasks()
  if (!tasks.some((task) => task.id === id)) throw new Error('Jadwal tidak ditemukan.')
  await writeTasks(tasks.filter((task) => task.id !== id))
}
