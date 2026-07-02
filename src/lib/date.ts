export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function startOfWeekMonday(d: Date): Date {
  const dow = (d.getDay() + 6) % 7 // 0 = lunedì ... 6 = domenica
  return addDays(d, -dow)
}

export function formatHeaderDate(d: Date): string {
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b)
}
