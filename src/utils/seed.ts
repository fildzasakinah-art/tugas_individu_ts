import type { CareTask } from '../types/care-task'
import { toDateInputValue } from './date'

function shiftDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

export function createStarterTasks(): CareTask[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'starter-food',
      title: 'Isi ulang makanan',
      petName: 'Milo',
      category: 'Makan',
      dueDate: shiftDate(0),
      dueTime: '08:00',
      notes: 'Porsi 1 cangkir, pastikan air minum juga penuh.',
      status: 'pending',
      createdAt: now,
      completedAt: null,
    },
    {
      id: 'starter-groom',
      title: 'Sikat bulu',
      petName: 'Milo',
      category: 'Grooming',
      dueDate: shiftDate(1),
      dueTime: '16:30',
      notes: 'Gunakan sikat lembut kesukaannya.',
      status: 'pending',
      createdAt: now,
      completedAt: null,
    },
    {
      id: 'starter-vet',
      title: 'Kontrol rutin dokter hewan',
      petName: 'Luna',
      category: 'Kesehatan',
      dueDate: shiftDate(4),
      dueTime: '10:00',
      notes: 'Bawa buku vaksin.',
      status: 'pending',
      createdAt: now,
      completedAt: null,
    },
    {
      id: 'starter-walk',
      title: 'Jalan sore di taman',
      petName: 'Milo',
      category: 'Aktivitas',
      dueDate: shiftDate(-1),
      dueTime: '17:00',
      notes: 'Jalan santai 20 menit.',
      status: 'completed',
      createdAt: now,
      completedAt: now,
    },
  ]
}
