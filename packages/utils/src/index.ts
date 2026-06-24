// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function dateDiffDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((to.getTime() - from.getTime()) / msPerDay)
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return diff > 0 && diff <= hours * 60 * 60 * 1000
}

// ─── Currency ────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── String Utilities ────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ─── Jornada ─────────────────────────────────────────────────────────────────

export function jornadaProgress(etapas: Array<{ status: string }>): number {
  if (!etapas.length) return 0
  const done = etapas.filter((e) => e.status === 'done').length
  return Math.round((done / etapas.length) * 100)
}

// ─── Sentiment ───────────────────────────────────────────────────────────────

export function sentimentoColor(label: string): string {
  const map: Record<string, string> = {
    positivo: '#3D6B4F',
    neutro: '#6A6458',
    negativo: '#8B2020',
    risco: '#8B2020',
  }
  return map[label] ?? '#6A6458'
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  const calc = (mod: number) => {
    let sum = 0
    for (let i = 0; i < mod - 1; i++) sum += parseInt(digits[i]) * (mod - i)
    const rem = (sum * 10) % 11
    return rem === 10 || rem === 11 ? 0 : rem
  }
  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10])
}
