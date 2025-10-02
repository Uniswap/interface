import { useMemo, useState } from 'react'
import {
  FORMAT_DATE_MONTH_DAY,
  FORMAT_TIME_SHORT,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'

function useForceUpdateEveryMinute(): number {
  const [unixTime, setUnixTime] = useState(Date.now())
  useInterval(() => {
    setUnixTime(Date.now())
  }, ONE_MINUTE_MS)
  return unixTime
}

export function useFormattedTimeForActivity(time: number): string {
  // we need to update formattedAddedTime every minute as it can be relative
  const unixTime = useForceUpdateEveryMinute()
  const localizedDayjs = useLocalizedDayjs()

  // biome-ignore lint/correctness/useExhaustiveDependencies: +unixTime (needed to update every minute)
  return useMemo(() => {
    const wrappedAddedTime = localizedDayjs(time)
    return localizedDayjs().isBefore(wrappedAddedTime.add(59, 'minute'), 'minute')
      ? // We do not use dayjs.duration() as it uses Math.round under the hood,
        // so for the first 30s it would show 0 minutes
        `${Math.ceil(localizedDayjs().diff(wrappedAddedTime) / ONE_MINUTE_MS)}m` // within an hour
      : localizedDayjs().isBefore(wrappedAddedTime.add(24, 'hour'))
        ? wrappedAddedTime.format(FORMAT_TIME_SHORT) // within last 24 hours
        : wrappedAddedTime.format(FORMAT_DATE_MONTH_DAY) // current year
  }, [time, unixTime, localizedDayjs])
}
