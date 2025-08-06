import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EstimatedTime } from 'uniswap/src/features/transactions/TransactionDetails/EstimatedTime'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

interface EstimatedTimeProps {
  timeMs?: number
  visibleIfLong?: boolean
}

export function EstimatedBridgeTime({ timeMs, visibleIfLong }: EstimatedTimeProps): JSX.Element | null {
  const { t } = useTranslation()

  const estimatedBridgingTime = useMemo(() => {
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

  if (
    !timeMs ||
    !estimatedBridgingTime ||
    (visibleIfLong && timeMs < ONE_MINUTE_MS) ||
    (!visibleIfLong && timeMs >= ONE_MINUTE_MS)
  ) {
    return null
  }

  return <EstimatedTime contentText={estimatedBridgingTime} />
}
