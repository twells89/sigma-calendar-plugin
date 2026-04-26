import React, { useMemo, useRef, useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import {
  useConfig,
  useElementData,
  useElementColumns,
  useVariable,
  useActionTrigger,
  useActionEffect,
} from '@sigmacomputing/plugin'

// ── Constants ──────────────────────────────────────────────────────────────

const VIEW_MAP = {
  Month:  'dayGridMonth',
  Week:   'timeGridWeek',
  Day:    'timeGridDay',
  Agenda: 'listMonth',
}

const FIRST_DAY_MAP = { Sunday: 0, Monday: 1, Saturday: 6 }

// 10-color palettes; index 0 is also the accent color for buttons/header
const COLOR_PALETTES = {
  Vibrant: ['#4C6EF5', '#F03E3E', '#2F9E44', '#E67700', '#7950F2', '#1098AD', '#C2255C', '#0CA678', '#E8590C', '#364FC7'],
  Cool:    ['#228BE6', '#1098AD', '#4C6EF5', '#7950F2', '#0CA678', '#15AABF', '#364FC7', '#6741D9', '#0D9488', '#0369A1'],
  Warm:    ['#E67700', '#C2255C', '#F03E3E', '#E8590C', '#D9480F', '#C92A2A', '#A61E4D', '#B82C3D', '#D97706', '#B45309'],
  Pastel:  ['#748FFC', '#FF8787', '#69DB7C', '#FFD43B', '#B197FC', '#66D9E8', '#F783AC', '#63E6BE', '#FFAB5F', '#74C0FC'],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDate(val) {
  if (val == null || val === '') return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  const str = String(val).trim()
  // Unix seconds (10 digits) or milliseconds (13 digits)
  if (/^\d{10}$/.test(str)) return new Date(parseInt(str, 10) * 1000)
  if (/^\d{13}$/.test(str)) return new Date(parseInt(str, 10))
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const config = useConfig()

  // Config values
  const sourceId      = config?.source
  const startCol      = config?.startDate
  const endCol        = config?.endDate
  const titleCol      = config?.title
  const descCol       = config?.description
  const colorByCol    = config?.colorBy
  const urlCol        = config?.url
  const defaultView   = VIEW_MAP[config?.defaultView] ?? 'dayGridMonth'
  const firstDay      = FIRST_DAY_MAP[config?.firstDay] ?? 0
  const showWeekends  = config?.showWeekends !== false && config?.showWeekends !== 'false'
  const showWeekNums  = config?.showWeekNumbers === true || config?.showWeekNumbers === 'true'
  const showEventTime = config?.showEventTime !== false && config?.showEventTime !== 'false'
  const palette       = COLOR_PALETTES[config?.colorScheme] ?? COLOR_PALETTES.Vibrant
  const accentColor   = palette[0]

  // Sigma data
  const elementData = useElementData(sourceId)
  const columns     = useElementColumns(sourceId)

  // Variables — wire to workbook parameters
  const [, setSelectedEvent] = useVariable('selectedEvent')
  const [selectedDate, setSelectedDate] = useVariable('selectedDate')

  // Action triggers — fire workbook actions
  const triggerEventClick = useActionTrigger('onEventClick')
  const triggerDateClick  = useActionTrigger('onDateClick')

  // Refs
  const calendarRef     = useRef(null)
  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate  // always up-to-date for action effect closure

  // Local UI state
  const [activeEventId, setActiveEventId] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  // Action effect — navigate the calendar to the value of the Selected Date variable
  useActionEffect('navigateToDate', () => {
    const val = selectedDateRef.current
    if (!calendarRef.current || !val) return
    const date = parseDate(val)
    if (date) calendarRef.current.getApi().gotoDate(date)
  })

  // ── Build FullCalendar events from Sigma data ────────────────────────────
  const { events, colorLegend } = useMemo(() => {
    if (!elementData || !startCol || !titleCol) {
      return { events: [], colorLegend: [] }
    }

    const startArr = elementData[startCol]  ?? []
    const endArr   = endCol     ? elementData[endCol]     ?? [] : []
    const titleArr = elementData[titleCol]  ?? []
    const descArr  = descCol    ? elementData[descCol]    ?? [] : []
    const colorArr = colorByCol ? elementData[colorByCol] ?? [] : []
    const urlArr   = urlCol     ? elementData[urlCol]     ?? [] : []

    const colorMap = new Map()
    const evts = []

    for (let i = 0; i < startArr.length; i++) {
      const start = parseDate(startArr[i])
      if (!start) continue

      const title    = String(titleArr[i] ?? '(no title)')
      const end      = endArr[i] != null ? parseDate(endArr[i]) ?? undefined : undefined
      const catVal   = colorArr[i]
      const rawUrl   = urlArr[i] ? String(urlArr[i]) : undefined

      let color = palette[0]
      if (colorByCol && catVal != null) {
        const cat = String(catVal)
        if (!colorMap.has(cat)) {
          colorMap.set(cat, palette[colorMap.size % palette.length])
        }
        color = colorMap.get(cat)
      }

      evts.push({
        id: String(i),
        title,
        start,
        end,
        color,
        url: rawUrl,
        extendedProps: {
          description: String(descArr[i] ?? ''),
          category:    colorByCol ? String(catVal ?? '') : '',
          columnName:  columns?.[titleCol]?.name ?? 'Event',
        },
      })
    }

    return { events: evts, colorLegend: Array.from(colorMap.entries()) }
  }, [elementData, startCol, endCol, titleCol, descCol, colorByCol, urlCol, palette, columns])

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleEventClick = useCallback((info) => {
    // Prevent navigation if there's a URL — handled natively by FullCalendar
    // unless we want to intercept; here we preventDefault to keep control
    info.jsEvent.preventDefault()
    const { id, title, startStr, url } = info.event
    setActiveEventId(id)
    setSelectedEvent(title)
    setSelectedDate(startStr)
    selectedDateRef.current = startStr
    triggerEventClick()
    setTooltip(null)
    if (url) window.open(url, '_blank', 'noopener')
  }, [setSelectedEvent, setSelectedDate, triggerEventClick])

  const handleDateClick = useCallback((info) => {
    selectedDateRef.current = info.dateStr
    setSelectedDate(info.dateStr)
    triggerDateClick()
  }, [setSelectedDate, triggerDateClick])

  const handleEventMouseEnter = useCallback((info) => {
    const rect = info.el.getBoundingClientRect()
    const { title, startStr, endStr, extendedProps } = info.event
    setTooltip({
      x:           Math.min(rect.left, window.innerWidth - 310),
      y:           rect.bottom + 6,
      title,
      startStr,
      endStr:      endStr ?? '',
      description: String(extendedProps.description ?? ''),
      category:    String(extendedProps.category ?? ''),
    })
  }, [])

  const handleEventMouseLeave = useCallback(() => setTooltip(null), [])

  // ── Render ────────────────────────────────────────────────────────────────

  const isConfigured = !!(sourceId && startCol && titleCol)

  const tooltipY = tooltip
    ? (tooltip.y + 160 > window.innerHeight ? tooltip.y - 220 : tooltip.y)
    : 0

  return (
    <div className="sc-root" style={{ '--sc-accent': accentColor }}>
      {!isConfigured ? (
        <EmptyState />
      ) : (
        <>
          <div className="sc-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={defaultView}
              headerToolbar={{
                left:   'prev,next today',
                center: 'title',
                right:  'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
              }}
              views={{
                dayGridMonth: { buttonText: 'Month' },
                timeGridWeek: { buttonText: 'Week' },
                timeGridDay:  { buttonText: 'Day' },
                listMonth:    { buttonText: 'Agenda' },
              }}
              events={events}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventMouseEnter={handleEventMouseEnter}
              eventMouseLeave={handleEventMouseLeave}
              height="100%"
              firstDay={firstDay}
              weekends={showWeekends}
              weekNumbers={showWeekNums}
              dayMaxEvents={4}
              moreLinkClick="popover"
              nowIndicator
              eventDisplay="block"
              displayEventTime={showEventTime}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              eventClassNames={(arg) =>
                arg.event.id === activeEventId ? ['sc-event--active'] : []
              }
            />
          </div>

          {colorLegend.length > 0 && (
            <div className="sc-legend">
              {colorLegend.map(([cat, color]) => (
                <span key={cat} className="sc-legend-item">
                  <span className="sc-legend-dot" style={{ background: color }} />
                  {cat || '(blank)'}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {tooltip && (
        <div className="sc-tooltip" style={{ left: tooltip.x, top: tooltipY }}>
          <div className="sc-tooltip-title">{tooltip.title}</div>
          {tooltip.category && (
            <div className="sc-tooltip-row">
              <span className="sc-tooltip-label">Category</span>
              {tooltip.category}
            </div>
          )}
          <div className="sc-tooltip-row">
            <span className="sc-tooltip-label">Time</span>
            {formatDateTime(tooltip.startStr)}
            {tooltip.endStr ? ` → ${formatDateTime(tooltip.endStr)}` : ''}
          </div>
          {tooltip.description && (
            <div className="sc-tooltip-desc">{tooltip.description}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="sc-empty">
      <svg
        width="52" height="52" viewBox="0 0 24 24" fill="none"
        stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="15" x2="9.01" y2="15" strokeWidth="2.5" />
        <line x1="12" y1="15" x2="12.01" y2="15" strokeWidth="2.5" />
        <line x1="15" y1="15" x2="15.01" y2="15" strokeWidth="2.5" />
      </svg>
      <p className="sc-empty-heading">Sigma Calendar</p>
      <p className="sc-empty-body">
        Open the editor panel and configure:<br />
        <strong>Data Source</strong>&nbsp;·&nbsp;
        <strong>Start Date</strong>&nbsp;·&nbsp;
        <strong>Event Title</strong>
      </p>
    </div>
  )
}
