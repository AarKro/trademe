// Swiss display formats, shared by all screens.

/** Average rating with a comma, e.g. 4.8 → «4,8». */
export const formatRating = (avg: number) => avg.toFixed(1).replace('.', ',')

const day = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Zurich' })
const clock = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })

/**
 * When the client wants the job done (trades.wanted_from / wanted_until, set in B/01).
 * B stores a day without time as 00:00 (start) and 23:59 (end), so those times are left out.
 * «ab Mi., 02.12., 09:00» · «Mi., 02.12. – Fr., 04.12.» · «Mi., 02.12., 09:00–12:00»
 */
export function formatWanted(from: string, until: string | null) {
  const start = new Date(from)
  const startTime = clock.format(start)
  const startText = startTime === '00:00' ? day.format(start) : `${day.format(start)}, ${startTime}`
  if (!until) return `ab ${startText}`

  const end = new Date(until)
  const endTime = clock.format(end)
  const showEndTime = endTime !== '23:59' && endTime !== '00:00'
  if (day.format(start) === day.format(end)) {
    return showEndTime ? `${startText}–${endTime}` : startText
  }
  return `${startText} – ${day.format(end)}${showEndTime ? `, ${endTime}` : ''}`
}
