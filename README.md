# Sigma Calendar Plugin

A full-featured interactive calendar plugin for [Sigma Computing](https://sigmacomputing.com), built with React and [FullCalendar](https://fullcalendar.io/).

**Live URL:** `https://twells89.github.io/sigma-calendar-plugin/`

---

## Features

- **4 calendar views** — Month, Week, Day, and Agenda (list)
- **Color coding** by any category column, across 4 color palettes
- **Hover tooltips** showing event details, category, and description
- **Click interactions** — fires Sigma action triggers and sets workbook variables on event or date click
- **Navigate To Date** — an action effect that lets Sigma drive the calendar to a specific date
- **URL column support** — events with a URL open it in a new tab on click
- **Toggle weekends, week numbers, and event times**
- **Configurable default view and first day of week**

---

## Registering the Plugin in Sigma

1. In Sigma, go to **Administration → Plugins**
2. Click **Add Plugin**
3. Fill in:
   - **Name:** Sigma Calendar
   - **URL:** `https://twells89.github.io/sigma-calendar-plugin/`
4. Save — the plugin is now available organization-wide

---

## Adding the Plugin to a Workbook

1. Open a workbook in **Edit** mode
2. Click **+** to add an element → **Plugins** → **Sigma Calendar**
3. Resize the element to your preferred size (the calendar fills 100% of the element)
4. Open the **element configuration panel** (pencil icon) to wire up your data

---

## Configuration Reference

### Required

| Field | Type | Description |
|---|---|---|
| **Data Source** | Element | The Sigma table or visualization that contains your event data |
| **Start Date / Time** | Column | Date or datetime column for the event start |
| **Event Title** | Column | Text column used as the event label on the calendar |

### Optional Columns

| Field | Type | Description |
|---|---|---|
| **End Date / Time** | Column | Event end — events without an end are treated as single-day/point-in-time |
| **Description / Notes** | Column | Shown in the hover tooltip |
| **Color By (Category)** | Column | Any column — unique values are automatically assigned colors from the chosen palette |
| **URL** | Column | If populated, clicking the event opens this URL in a new tab |

### Calendar Options

| Field | Default | Description |
|---|---|---|
| **Default View** | Month | Starting view when the plugin loads: Month, Week, Day, or Agenda |
| **First Day of Week** | Sunday | Sunday, Monday, or Saturday |
| **Show Weekends** | On | Toggle Saturday and Sunday columns |
| **Show Week Numbers** | Off | Displays ISO week numbers along the left edge |

### Display Options

| Field | Default | Description |
|---|---|---|
| **Color Scheme** | Vibrant | Palette used for category color coding. Options: Vibrant, Cool, Warm, Pastel |
| **Show Event Time** | On | Show the event start time on the event block |

### Interactivity

These connect the calendar to the rest of your workbook.

| Field | Type | Description |
|---|---|---|
| **Selected Event Variable** | Variable | Set to the clicked event's title. Wire to a workbook parameter to use downstream. |
| **Selected Date Variable** | Variable | Set to the clicked event's or date cell's ISO date string (e.g. `2025-03-15`). |
| **On Event Click** | Action Trigger | Fires when any event is clicked. Use this to trigger actions elsewhere in the workbook (e.g. show a modal, filter a table). |
| **On Date Click** | Action Trigger | Fires when an empty date cell is clicked. Useful for "create new event" workflows. |
| **Navigate To Date** | Action Effect | When this effect is triggered by a workbook action, the calendar navigates to the date stored in the **Selected Date Variable**. Use this to drive the calendar from a date picker or control elsewhere in your workbook. |

---

## Interactivity Patterns

### Pattern 1 — Click event → filter a table

1. Set **Selected Event Variable** to a workbook parameter (e.g. `event_name`)
2. Set **On Event Click** to trigger an action that filters a child table using `event_name`
3. When the user clicks a calendar event, the table below filters to matching rows

### Pattern 2 — Date picker → navigate calendar

1. Add a date control element to your workbook and bind it to a parameter (e.g. `nav_date`)
2. Set **Selected Date Variable** to `nav_date`
3. Create a workbook action: on date control change → trigger **Navigate To Date** on the calendar plugin
4. Selecting a date in the picker jumps the calendar to that month/week

### Pattern 3 — Click date → set context for a form

1. Set **Selected Date Variable** to a parameter (e.g. `selected_day`)
2. Set **On Date Click** to trigger an action that opens a modal or populates a form
3. The form reads `selected_day` to pre-fill the date field

---

## Local Development

```bash
git clone https://github.com/twells89/sigma-calendar-plugin.git
cd sigma-calendar-plugin
npm install
npm run dev
# → http://localhost:3000/sigma-calendar-plugin/
```

To test against a live Sigma workbook:

1. Open any workbook in **Edit** mode
2. Add a **Plugins** element → select **Sigma Plugin Dev Playground**
3. In the element menu (⋯) → **Point to Development URL**
4. Enter `http://localhost:3000/sigma-calendar-plugin/`

Changes hot-reload automatically — no page refresh needed.

---

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via the included GitHub Actions workflow.

To manually trigger a deploy: **Actions → Deploy to GitHub Pages → Run workflow**

---

## Data Requirements

Your data source needs at minimum:

- A **date or datetime column** for event start times
- A **text column** for event titles

Dates can be in any of these formats:
- ISO 8601: `2025-03-15` or `2025-03-15T10:30:00Z`
- Unix timestamp in seconds (10 digits): `1742000000`
- Unix timestamp in milliseconds (13 digits): `1742000000000`
- Any format parseable by `new Date()`

---

## Tech Stack

- [React 18](https://react.dev/)
- [FullCalendar v6](https://fullcalendar.io/) — daygrid, timegrid, list, interaction plugins
- [@sigmacomputing/plugin](https://www.npmjs.com/package/@sigmacomputing/plugin)
- [Vite 5](https://vitejs.dev/)
