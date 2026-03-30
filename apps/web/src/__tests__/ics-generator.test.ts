import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateICS, downloadICS } from '@/lib/ics-generator'

describe('generateICS', () => {
  it('should generate valid ICS with dueDate only (all-day event)', () => {
    const ics = generateICS({
      title: 'Buy milk',
      dueDate: '2026-04-01',
    })

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('SUMMARY:Buy milk')
    // All-day event uses VALUE=DATE format
    expect(ics).toContain('DTSTART;VALUE=DATE:20260401')
    expect(ics).toContain('DTEND;VALUE=DATE:20260402')
  })

  it('should generate ICS with startTime and endTime', () => {
    const ics = generateICS({
      title: 'Meeting',
      dueDate: '2026-04-01',
      startTime: '09:00',
      endTime: '10:00',
    })

    expect(ics).toContain('DTSTART:20260401T090000')
    expect(ics).toContain('DTEND:20260401T100000')
    expect(ics).toContain('SUMMARY:Meeting')
  })

  it('should generate ICS with startTime only (1-hour default duration)', () => {
    const ics = generateICS({
      title: 'Standup',
      dueDate: '2026-04-01',
      startTime: '09:00',
    })

    expect(ics).toContain('DTSTART:20260401T090000')
    expect(ics).toContain('DTEND:20260401T100000')
  })

  it('should generate ICS with endTime only (1-hour before as start)', () => {
    const ics = generateICS({
      title: 'Deadline',
      dueDate: '2026-04-01',
      endTime: '17:00',
    })

    expect(ics).toContain('DTSTART:20260401T160000')
    expect(ics).toContain('DTEND:20260401T170000')
  })

  it('should include description when provided', () => {
    const ics = generateICS({
      title: 'Task',
      dueDate: '2026-04-01',
      description: 'This is a detailed description',
    })

    expect(ics).toContain('DESCRIPTION:This is a detailed description')
  })

  it('should not include DESCRIPTION when not provided', () => {
    const ics = generateICS({
      title: 'Task',
      dueDate: '2026-04-01',
    })

    expect(ics).not.toContain('DESCRIPTION')
  })

  it('should include PRODID and VERSION headers', () => {
    const ics = generateICS({
      title: 'Task',
      dueDate: '2026-04-01',
    })

    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:')
  })

  it('should handle startTime at 23:00 with default 1-hour duration', () => {
    const ics = generateICS({
      title: 'Late night',
      dueDate: '2026-04-01',
      startTime: '23:00',
    })

    // End time should be 00:00 next day
    expect(ics).toContain('DTSTART:20260401T230000')
    expect(ics).toContain('DTEND:20260402T000000')
  })

  it('should escape special characters in title', () => {
    const ics = generateICS({
      title: 'Meeting, with; colleagues',
      dueDate: '2026-04-01',
    })

    expect(ics).toContain('SUMMARY:Meeting\\, with\\; colleagues')
  })
})

describe('downloadICS', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a blob and trigger download', () => {
    const mockClick = vi.fn()
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
      style: {},
    } as unknown as HTMLAnchorElement)

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
    const mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    downloadICS('BEGIN:VCALENDAR\nEND:VCALENDAR', 'test-event.ics')

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    mockCreateElement.mockRestore()
  })
})
