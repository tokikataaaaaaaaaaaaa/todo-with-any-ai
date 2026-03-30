function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

function formatDateOnly(dateStr: string): string {
  // "2026-04-01" -> "20260401"
  return dateStr.replace(/-/g, '')
}

function formatDateTime(dateStr: string, time: string): string {
  // "2026-04-01", "09:00" -> "20260401T090000"
  return `${dateStr.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function addHours(dateStr: string, time: string, hours: number): { date: string; time: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [h, m] = time.split(':').map(Number)
  const dt = new Date(year, month - 1, day, h + hours, m)
  const newDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  const newTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  return { date: newDate, time: newTime }
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const dt = new Date(year, month - 1, day + days)
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`
}

export function generateICS(todo: {
  title: string
  dueDate: string
  startTime?: string | null
  endTime?: string | null
  description?: string
}): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//todo-with-any-ai//EN',
    'BEGIN:VEVENT',
  ]

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@todo-with-any-ai`
  lines.push(`UID:${uid}`)

  const hasStart = todo.startTime != null && todo.startTime !== ''
  const hasEnd = todo.endTime != null && todo.endTime !== ''

  if (!hasStart && !hasEnd) {
    // All-day event
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(todo.dueDate)}`)
    lines.push(`DTEND;VALUE=DATE:${addDays(todo.dueDate, 1)}`)
  } else if (hasStart && hasEnd) {
    lines.push(`DTSTART:${formatDateTime(todo.dueDate, todo.startTime!)}`)
    lines.push(`DTEND:${formatDateTime(todo.dueDate, todo.endTime!)}`)
  } else if (hasStart && !hasEnd) {
    // startTime only -> 1-hour default duration
    const end = addHours(todo.dueDate, todo.startTime!, 1)
    lines.push(`DTSTART:${formatDateTime(todo.dueDate, todo.startTime!)}`)
    lines.push(`DTEND:${formatDateTime(end.date, end.time)}`)
  } else {
    // endTime only -> 1-hour before as start
    const start = addHours(todo.dueDate, todo.endTime!, -1)
    lines.push(`DTSTART:${formatDateTime(start.date, start.time)}`)
    lines.push(`DTEND:${formatDateTime(todo.dueDate, todo.endTime!)}`)
  }

  lines.push(`SUMMARY:${escapeICS(todo.title)}`)

  if (todo.description) {
    lines.push(`DESCRIPTION:${escapeICS(todo.description)}`)
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
