import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EstimatedTime } from 'uniswap/src/features/transactions/TransactionDetails/EstimatedTime'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

interface EstimatedTimeProps {
  /** The estimated swap time in milliseconds */
  timeMs?: number
  /**
   * The time in milliseconds to hide the component
   * @default 60000
   **/
  cutoffTimeMs?: number
  /** Show if @timeMs is longer than @cutoffTimeMs */
  showIfLongerThanCutoff: boolean
}

/**
 * Component used to display the estimated swap time in transaction/swap details.
 *
 * This component is shown in multiple places but conditionally based on how long
 * the swap is expected to take. For example, the swap review component will conditionally
 * show this based on the @timeMs duration. If the swap review details are expanded, we want
 * to prevent rendering this component twice by checking the @showIfLongerThanCutoff flag.
 *
 * @returns The estimated swap time component or null if no time is provided or if
 * the time is short and @showIfLongerThanCutoff is true
 */
export function EstimatedSwapTime({
  timeMs,
  showIfLongerThanCutoff,
  cutoffTimeMs = ONE_MINUTE_MS,
}: EstimatedTimeProps): JSX.Element | null {
  const { t } = useTranslation()

  const estimatedSwapTime = useMemo(() => {
    if (!timeMs) {
      return null
    }

    const minutes = Math.floor(timeMs / ONE_MINUTE_MS)
    const seconds = Math.floor((timeMs % ONE_MINUTE_MS) / ONE_SECOND_MS)

    if (seconds === 0) {
      return t('bridging.estimatedTime.minutesOnly', { minutes })
    } else if (minutes === 0) {
      return t('bridging.estimatedTime.secondsOnly', { seconds })
    } else {
      return t('bridging.estimatedTime.minutesAndSeconds', {
        minutes,
        seconds,
      })
    }
  }, [timeMs, t])

  if (!timeMs || !estimatedSwapTime) {
    return null
  }

  const longerThanCutoff = timeMs >= cutoffTimeMs
  if (showIfLongerThanCutoff !== longerThanCutoff) {
    return null
  }

  return <EstimatedTime contentText={estimatedSwapTime} />
}
