import './style.css'
import { isCareCategory, type CareCategory, type CareTask, type CareTaskInput, type TaskFilter } from './types/care-task'
import {
  createCareTask,
  deleteCareTask,
  listCareTasks,
  toggleCareTaskCompletion,
  updateCareTask,
} from './services/care-task-service'
import { formatDate, getDueStatus, toDateInputValue } from './utils/date'
import { createStarterTasks } from './utils/seed'
import { readTasks, writeTasks } from './utils/storage'

function getAppElement(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>('#app')
  if (!element) throw new Error('Elemen aplikasi #app tidak ditemukan.')
  return element
}

const app = getAppElement()

const categoryIcons: Record<CareCategory, string> = {
  Makan: '🥣',
  Kesehatan: '🩺',
  Grooming: '✂️',
  Aktivitas: '🎾',
  Lainnya: '🐾',
}

let tasks: CareTask[] = []
let activeFilter: TaskFilter = 'all'
let searchQuery = ''
let editingId: string | null = null

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character] ?? character
  })
}

function showNotice(message: string, kind: 'error' | 'success' = 'success'): void {
  const notice = document.querySelector<HTMLDivElement>('#notice')
  if (!notice) return
  notice.textContent = message
  notice.className = `notice notice--${kind}`
  notice.hidden = false
  window.setTimeout(() => {
    notice.hidden = true
  }, 3600)
}

function dueLabel(task: CareTask): { text: string; className: string } {
  const status = getDueStatus(task)
  if (status === 'completed') return { text: 'Selesai', className: 'tag--completed' }
  if (status === 'overdue') return { text: 'Terlambat', className: 'tag--overdue' }
  if (status === 'due-today') return { text: 'Hari ini', className: 'tag--today' }
  return { text: 'Terjadwal', className: 'tag--upcoming' }
}

function taskCard(task: CareTask): string {
  const status = dueLabel(task)
  const completeLabel = task.status === 'completed' ? 'Batalkan selesai' : 'Tandai selesai'
  return `
    <article class="task-card ${task.status === 'completed' ? 'task-card--done' : ''}">
      <div class="task-icon" aria-hidden="true">${categoryIcons[task.category]}</div>
      <div class="task-copy">
        <div class="task-title-row">
          <h3>${escapeHtml(task.title)}</h3>
          <span class="status-tag ${status.className}">${status.text}</span>
        </div>
        <p class="task-meta">${escapeHtml(task.petName)} <span>·</span> ${escapeHtml(task.category)}</p>
        ${task.notes ? `<p class="task-note">${escapeHtml(task.notes)}</p>` : ''}
        <p class="task-when"><span aria-hidden="true">◷</span> ${escapeHtml(formatDate(task.dueDate))} · ${escapeHtml(task.dueTime)}</p>
      </div>
      <div class="task-actions">
        <button class="icon-button complete-button" type="button" data-action="toggle" data-id="${escapeHtml(task.id)}" aria-label="${completeLabel}" title="${completeLabel}">
          ${task.status === 'completed' ? '↶' : '✓'}
        </button>
        <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(task.id)}" aria-label="Edit jadwal" title="Edit jadwal">✎</button>
        <button class="icon-button icon-button--delete" type="button" data-action="delete" data-id="${escapeHtml(task.id)}" aria-label="Hapus jadwal" title="Hapus jadwal">×</button>
      </div>
    </article>`
}

function render(): void {
  const now = new Date()
  const pending = tasks.filter((task) => task.status === 'pending')
  const dueSoon = pending.filter((task) => {
    const status = getDueStatus(task, now)
    return status === 'overdue' || status === 'due-today'
  }).length
  const completed = tasks.filter((task) => task.status === 'completed')
  const filtered = tasks
    .filter((task) => {
      if (activeFilter === 'pending' && task.status !== 'pending') return false
      if (activeFilter === 'completed' && task.status !== 'completed') return false
      const searchable = `${task.title} ${task.petName} ${task.category} ${task.notes}`.toLocaleLowerCase('id-ID')
      return searchable.includes(searchQuery.toLocaleLowerCase('id-ID'))
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.dueTime.localeCompare(b.dueTime))

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="Pet Care Log beranda">
          <span class="brand-mark">🐾</span>
          <span>pet<span class="brand-light">care</span><small>LOG HARIAN</small></span>
        </a>
        <nav class="top-nav" aria-label="Navigasi utama">
          <a class="nav-link nav-link--active" href="#jadwal">Jadwal</a>
          <a class="nav-link" href="#ringkasan">Ringkasan</a>
          <a class="nav-link" href="#riwayat">Riwayat</a>
        </nav>
        <button class="button button--primary top-add" type="button" data-action="new" aria-label="Tambah jadwal">＋ <span>Tambah jadwal</span></button>
      </header>

      <main>
        <section class="hero">
          <div class="hero-orbit hero-orbit--one"></div>
          <div class="hero-orbit hero-orbit--two"></div>
          <div class="hero-content">
            <p class="eyebrow"><span class="eyebrow-dot"></span> HARI-HARI KECIL, CINTA YANG BESAR</p>
            <h1>Rawat mereka,<br><em>satu hari</em> demi satu.</h1>
            <p class="hero-description">Semua rutinitas si manis di satu tempat. Biar tak ada jadwal makan, jalan-jalan, atau cek kesehatan yang terlewat.</p>
            <button class="button button--light" type="button" data-action="new">＋ Tambah rutinitas</button>
            <div class="hero-footnote"><span class="avatar-stack"><b>🐶</b><b>🐱</b><b>🐰</b></span><span>Dibuat dengan sepenuh hati <strong>untuk sahabatmu</strong></span></div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="sun-disc"></div>
            <div class="hero-pet">🐕</div>
            <div class="hero-sticker sticker--heart">♡</div>
            <div class="hero-sticker sticker--spark">✳</div>
            <div class="hero-caption">teman baik,<br>hari yang baik</div>
            <div class="hero-shadow"></div>
          </div>
          <div class="hero-number">01 <span>— 04</span></div>
        </section>

        <section class="welcome-row">
          <div>
            <p class="eyebrow eyebrow--muted">HARI YANG MENYENANGKAN <span class="date-divider">/</span> ${formatDate(toDateInputValue(now), { weekday: 'long', month: 'long' })}</p>
            <h2>Halo, pet parent <span class="wave">✳</span></h2>
            <p class="section-subtitle">Yuk, lihat apa yang perlu dilakukan hari ini.</p>
          </div>
          <div class="pet-picker"><span class="pet-avatar">🐶</span><span><small>SAHABATKU</small><strong>Milo & Luna</strong></span><span class="chevron">⌄</span></div>
        </section>

        <section id="ringkasan" class="summary-grid" aria-label="Ringkasan perawatan">
          <article class="summary-card summary-card--orange">
            <div class="summary-top"><span>PERLU PERHATIAN</span><span class="summary-icon">✳</span></div>
            <strong>${dueSoon.toString().padStart(2, '0')}</strong>
            <p>jadwal jatuh tempo</p>
            <span class="summary-decoration">🐾</span>
          </article>
          <article class="summary-card summary-card--cream">
            <div class="summary-top"><span>SELANJUTNYA</span><span class="summary-icon">◷</span></div>
            <strong>${pending.length.toString().padStart(2, '0')}</strong>
            <p>rutinitas menunggu</p>
            <span class="summary-decoration summary-decoration--flower">✿</span>
          </article>
          <article class="summary-card summary-card--dark">
            <div class="summary-top"><span>GOOD JOB!</span><span class="summary-icon">♡</span></div>
            <strong>${completed.length.toString().padStart(2, '0')}</strong>
            <p>perawatan selesai</p>
            <span class="summary-decoration">✦</span>
          </article>
        </section>

        <section id="jadwal" class="schedule-section">
          <div class="section-heading">
            <div><p class="eyebrow eyebrow--muted">JANGAN SAMPAI TERLEWAT</p><h2>Rutinitas perawatan <span class="heading-count">${tasks.length}</span></h2></div>
            <button class="button button--outline" type="button" data-action="new"><span class="plus">＋</span> Jadwal baru</button>
          </div>
          <div class="toolbar">
            <div class="filter-tabs" role="tablist" aria-label="Filter jadwal">
              <button type="button" role="tab" aria-selected="${activeFilter === 'all'}" class="filter-tab ${activeFilter === 'all' ? 'is-active' : ''}" data-filter="all">Semua <span>${tasks.length}</span></button>
              <button type="button" role="tab" aria-selected="${activeFilter === 'pending'}" class="filter-tab ${activeFilter === 'pending' ? 'is-active' : ''}" data-filter="pending">Akan datang <span>${pending.length}</span></button>
              <button type="button" role="tab" aria-selected="${activeFilter === 'completed'}" class="filter-tab ${activeFilter === 'completed' ? 'is-active' : ''}" data-filter="completed">Selesai <span>${completed.length}</span></button>
            </div>
            <label class="search-box"><span aria-hidden="true">⌕</span><input id="task-search" type="search" placeholder="Cari rutinitas..." value="${escapeHtml(searchQuery)}" aria-label="Cari rutinitas"></label>
          </div>
          <div class="task-list">${filtered.length ? filtered.map(taskCard).join('') : `
            <div class="empty-state"><span>🐾</span><h3>${searchQuery ? 'Belum ada yang cocok' : 'Belum ada rutinitas di sini'}</h3><p>${searchQuery ? 'Coba kata kunci yang berbeda.' : 'Tambahkan rutinitas baru untuk sahabatmu.'}</p>${!searchQuery && activeFilter !== 'completed' ? '<button class="button button--primary" type="button" data-action="new">＋ Buat jadwal</button>' : ''}</div>`}</div>
        </section>

        <section id="riwayat" class="history-banner">
          <div class="history-art" aria-hidden="true"><span>♥</span><span>✿</span><span>🐾</span></div>
          <div><p class="eyebrow">JEJAK KASIH SAYANG</p><h2>Setiap perawatan<br>berarti.</h2><p>Sudah ada <strong>${completed.length} rutinitas</strong> yang kamu selesaikan. Kebaikan kecil, dampak besar.</p></div>
          <a href="#jadwal" class="history-link" data-filter-link="completed">Lihat riwayat <span>↗</span></a>
          <div class="history-counter">${completed.length.toString().padStart(2, '0')} <small>tersimpan</small></div>
        </section>
      </main>
      <footer class="footer"><span>🐾 <strong>petcare log</strong> · Teman baik, dirawat dengan baik.</span><span>Disusun dengan cinta <b>♥</b></span></footer>
    </div>

    <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
    <dialog id="task-dialog" class="task-dialog">
      <form id="task-form" novalidate>
        <div class="dialog-heading"><div><p class="eyebrow eyebrow--muted">SEDIKIT PERHATIAN, BANYAK CINTA</p><h2 id="dialog-title">Buat jadwal baru</h2></div><button class="icon-button dialog-close" type="button" data-action="close" aria-label="Tutup">×</button></div>
        <label class="form-field">Nama rutinitas<input name="title" type="text" placeholder="Contoh: Jalan pagi" minlength="2" maxlength="70" required></label>
        <div class="form-row">
          <label class="form-field">Nama hewan<input name="petName" type="text" placeholder="Contoh: Milo" maxlength="40" required></label>
          <label class="form-field">Kategori<select name="category" required><option value="Makan">🥣 Makan</option><option value="Kesehatan">🩺 Kesehatan</option><option value="Grooming">✂️ Grooming</option><option value="Aktivitas">🎾 Aktivitas</option><option value="Lainnya">🐾 Lainnya</option></select></label>
        </div>
        <div class="form-row">
          <label class="form-field">Tanggal<input name="dueDate" type="date" required></label>
          <label class="form-field">Jam<input name="dueTime" type="time" required></label>
        </div>
        <label class="form-field">Catatan <span class="optional">(opsional)</span><textarea name="notes" rows="3" maxlength="240" placeholder="Tambahkan detail kecil yang perlu diingat..."></textarea></label>
        <p class="form-error" id="form-error" role="alert" hidden></p>
        <div class="dialog-actions"><button class="button button--text" type="button" data-action="close">Batal</button><button class="button button--primary" type="submit">Simpan jadwal <span>↗</span></button></div>
      </form>
    </dialog>`
  bindEvents()
}

function bindEvents(): void {
  app!.querySelectorAll<HTMLButtonElement>('[data-action="new"]').forEach((button) => {
    button.addEventListener('click', () => openDialog())
  })
  app!.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter
      if (filter === 'all' || filter === 'pending' || filter === 'completed') {
        activeFilter = filter
        render()
      }
    })
  })
  app!.querySelector<HTMLInputElement>('#task-search')?.addEventListener('input', (event) => {
    searchQuery = (event.currentTarget as HTMLInputElement).value
    const cursorPosition = (event.currentTarget as HTMLInputElement).selectionStart
    render()
    const search = app!.querySelector<HTMLInputElement>('#task-search')
    search?.focus()
    if (cursorPosition !== null) search?.setSelectionRange(cursorPosition, cursorPosition)
  })
  app!.querySelectorAll<HTMLButtonElement>('[data-action="toggle"], [data-action="edit"], [data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id
      if (!id) return
      if (button.dataset.action === 'edit') openDialog(tasks.find((task) => task.id === id))
      if (button.dataset.action === 'toggle') void runTaskAction(async () => toggleCareTaskCompletion(id), 'Status jadwal diperbarui.')
      if (button.dataset.action === 'delete') {
        const task = tasks.find((item) => item.id === id)
        if (task && window.confirm(`Hapus jadwal "${task.title}"?`)) {
          void runTaskAction(async () => deleteCareTask(id), 'Jadwal berhasil dihapus.')
        }
      }
    })
  })
  app!.querySelectorAll<HTMLAnchorElement>('[data-filter-link], a[href="#riwayat"]').forEach((link) => {
    link.addEventListener('click', () => {
      activeFilter = 'completed'
      render()
    })
  })

  const dialog = document.querySelector<HTMLDialogElement>('#task-dialog')
  dialog?.querySelectorAll<HTMLButtonElement>('[data-action="close"]').forEach((button) => {
    button.addEventListener('click', () => dialog.close())
  })
  dialog?.querySelector<HTMLFormElement>('#task-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    void submitForm(event.currentTarget as HTMLFormElement)
  })
}

function openDialog(task?: CareTask): void {
  editingId = task?.id ?? null
  const dialog = document.querySelector<HTMLDialogElement>('#task-dialog')
  const form = dialog?.querySelector<HTMLFormElement>('#task-form')
  if (!dialog || !form) return

  form.reset()
  const title = dialog.querySelector<HTMLHeadingElement>('#dialog-title')
  if (title) title.textContent = task ? 'Edit jadwal' : 'Buat jadwal baru'
  const fields = form.elements
  ;(fields.namedItem('title') as HTMLInputElement).value = task?.title ?? ''
  ;(fields.namedItem('petName') as HTMLInputElement).value = task?.petName ?? ''
  ;(fields.namedItem('category') as HTMLSelectElement).value = task?.category ?? 'Makan'
  ;(fields.namedItem('dueDate') as HTMLInputElement).value = task?.dueDate ?? toDateInputValue(new Date())
  ;(fields.namedItem('dueTime') as HTMLInputElement).value = task?.dueTime ?? '09:00'
  ;(fields.namedItem('notes') as HTMLTextAreaElement).value = task?.notes ?? ''
  const error = form.querySelector<HTMLParagraphElement>('#form-error')
  if (error) error.hidden = true
  dialog.showModal()
  ;(fields.namedItem('title') as HTMLInputElement).focus()
}

async function submitForm(form: HTMLFormElement): Promise<void> {
  const error = form.querySelector<HTMLParagraphElement>('#form-error')
  if (!form.reportValidity()) return
  const formData = new FormData(form)
  const categoryValue = String(formData.get('category') ?? '')
  if (!isCareCategory(categoryValue)) {
    if (error) {
      error.textContent = 'Pilih kategori perawatan yang tersedia.'
      error.hidden = false
    }
    return
  }
  const input: CareTaskInput = {
    title: String(formData.get('title') ?? '').trim(),
    petName: String(formData.get('petName') ?? '').trim(),
    category: categoryValue,
    dueDate: String(formData.get('dueDate') ?? ''),
    dueTime: String(formData.get('dueTime') ?? ''),
    notes: String(formData.get('notes') ?? '').trim(),
  }
  if (
    input.title.length < 2 ||
    !input.petName ||
    !input.dueDate ||
    !input.dueTime
  ) {
    if (error) {
      error.textContent = 'Lengkapi nama rutinitas, nama hewan, tanggal, dan jam dengan benar.'
      error.hidden = false
    }
    return
  }

  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = 'Menyimpan...'
  }
  try {
    if (editingId) await updateCareTask(editingId, input)
    else await createCareTask(input)
    await refreshTasks()
    document.querySelector<HTMLDialogElement>('#task-dialog')?.close()
    showNotice(editingId ? 'Jadwal berhasil diperbarui.' : 'Jadwal baru berhasil disimpan.')
    editingId = null
  } catch (cause) {
    if (error) {
      error.textContent = cause instanceof Error ? cause.message : 'Jadwal gagal disimpan. Coba lagi.'
      error.hidden = false
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false
      submitButton.innerHTML = 'Simpan jadwal <span>↗</span>'
    }
  }
}

async function runTaskAction(action: () => Promise<unknown>, successMessage: string): Promise<void> {
  try {
    await action()
    await refreshTasks()
    showNotice(successMessage)
  } catch (cause) {
    showNotice(cause instanceof Error ? cause.message : 'Perubahan gagal disimpan.', 'error')
  }
}

async function refreshTasks(): Promise<void> {
  tasks = await listCareTasks()
  render()
}

async function startApp(): Promise<void> {
  try {
    const saved = await readTasks()
    if (saved === null) {
      tasks = createStarterTasks()
      await writeTasks(tasks)
    } else {
      tasks = await listCareTasks()
    }
    render()
  } catch (cause) {
    app!.innerHTML = `<main class="load-error"><span>🐾</span><h1>Oops, data belum bisa dibuka.</h1><p>${escapeHtml(cause instanceof Error ? cause.message : 'Periksa pengaturan penyimpanan browser lalu muat ulang halaman.')}</p><button class="button button--primary" type="button" id="retry-load">Coba lagi</button></main>`
    app!.querySelector<HTMLButtonElement>('#retry-load')?.addEventListener('click', () => void startApp())
  }
}

void startApp()
