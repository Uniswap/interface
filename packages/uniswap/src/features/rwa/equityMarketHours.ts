// The U.S. equity market is open on weekdays from 9:30am ET → 4:00pm ET.
// Off-hours is any time outside that window. Computed client-side in
// America/New_York (DST-aware). Market holidays are not accounted for.

const ET_TIME_ZONE = 'America/New_York'

const MARKET_OPEN_MINUTES = 9 * 60 + 30 // 9:30am ET
const MARKET_CLOSE_MINUTES = 16 * 60 // 4:00pm ET

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const SATURDAY = WEEKDAY_TO_INDEX['Sat']
const SUNDAY = WEEKDAY_TO_INDEX['Sun']

function getEasternTimeParts(date: Date): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const weekdayLabel = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const hourValue = parts.find((part) => part.type === 'hour')?.value ?? '0'
  const minuteValue = parts.find((part) => part.type === 'minute')?.value ?? '0'

  return {
    weekday: WEEKDAY_TO_INDEX[weekdayLabel] ?? -1,
    minutes: Number.parseInt(hourValue, 10) * 60 + Number.parseInt(minuteValue, 10),
  }
}

export function isEquityMarketOffHours(date: Date): boolean {
  const { weekday, minutes } = getEasternTimeParts(date)

  if (weekday === SATURDAY || weekday === SUNDAY) {
    return true
  }
  return minutes < MARKET_OPEN_MINUTES || minutes >= MARKET_CLOSE_MINUTES
}
