import React from 'react'
import ReactDOM from 'react-dom/client'
import { client, SigmaClientProvider } from '@sigmacomputing/plugin'
import App from './App'
import './index.css'

client.config.configureEditorPanel([
  // ── Data Source ──────────────────────────────────────────────────────────
  { name: 'source', type: 'element', label: 'Data Source' },

  // ── Required Columns ─────────────────────────────────────────────────────
  { name: 'startDate', type: 'column', source: 'source', allowMultiple: false, label: 'Start Date / Time' },
  { name: 'title', type: 'column', source: 'source', allowMultiple: false, label: 'Event Title' },

  // ── Optional Columns ─────────────────────────────────────────────────────
  { name: 'optionalColumns', type: 'group', label: 'Optional Columns' },
  { name: 'endDate', type: 'column', source: 'source', allowMultiple: false, label: 'End Date / Time' },
  { name: 'description', type: 'column', source: 'source', allowMultiple: false, label: 'Description / Notes' },
  { name: 'colorBy', type: 'column', source: 'source', allowMultiple: false, label: 'Color By (Category)' },
  { name: 'url', type: 'column', source: 'source', allowMultiple: false, label: 'URL (opens on click)' },

  // ── Calendar Options ──────────────────────────────────────────────────────
  { name: 'calendarOptions', type: 'group', label: 'Calendar Options' },
  {
    name: 'defaultView',
    type: 'dropdown',
    source: 'calendarOptions',
    label: 'Default View',
    values: ['Month', 'Week', 'Day', 'Agenda'],
    defaultValue: 'Month',
  },
  {
    name: 'firstDay',
    type: 'dropdown',
    source: 'calendarOptions',
    label: 'First Day of Week',
    values: ['Sunday', 'Monday', 'Saturday'],
    defaultValue: 'Sunday',
  },
  { name: 'showWeekends',    type: 'toggle', source: 'calendarOptions', label: 'Show Weekends',     defaultValue: true },
  { name: 'showWeekNumbers', type: 'toggle', source: 'calendarOptions', label: 'Show Week Numbers', defaultValue: false },

  // ── Display Options ───────────────────────────────────────────────────────
  { name: 'displayOptions', type: 'group', label: 'Display Options' },
  {
    name: 'colorScheme',
    type: 'dropdown',
    source: 'displayOptions',
    label: 'Color Scheme',
    values: ['Vibrant', 'Cool', 'Warm', 'Pastel'],
    defaultValue: 'Vibrant',
  },
  { name: 'showEventTime', type: 'toggle', source: 'displayOptions', label: 'Show Event Time', defaultValue: true },

  // ── Interactivity ─────────────────────────────────────────────────────────
  { name: 'interactivity', type: 'group', label: 'Interactivity' },
  { name: 'selectedEvent', type: 'variable',       source: 'interactivity', label: 'Selected Event Variable' },
  { name: 'selectedDate',  type: 'variable',       source: 'interactivity', label: 'Selected Date Variable' },
  { name: 'onEventClick',  type: 'action-trigger', source: 'interactivity', label: 'On Event Click' },
  { name: 'onDateClick',   type: 'action-trigger', source: 'interactivity', label: 'On Date Click' },
  { name: 'navigateToDate', type: 'action-effect', source: 'interactivity', label: 'Navigate To Date' },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SigmaClientProvider client={client}>
      <App />
    </SigmaClientProvider>
  </React.StrictMode>
)
