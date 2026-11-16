export const CARE_CATEGORIES = ['Makan', 'Kesehatan', 'Grooming', 'Aktivitas', 'Lainnya'] as const

export type CareCategory = (typeof CARE_CATEGORIES)[number]

export function isCareCategory(value: string): value is CareCategory {
  return CARE_CATEGORIES.some((category) => category === value)
}

export type CareStatus = 'pending' | 'completed'

export type DueStatus = 'overdue' | 'due-today' | 'upcoming' | 'completed'

export interface CareTask {
  id: string
  title: string
  petName: string
  category: CareCategory
  dueDate: string
  dueTime: string
  notes: string
  status: CareStatus
  createdAt: string
  completedAt: string | null
}

export interface CareTaskInput {
  title: string
  petName: string
  category: CareCategory
  dueDate: string
  dueTime: string
  notes: string
}

export type TaskFilter = 'all' | 'pending' | 'completed'
