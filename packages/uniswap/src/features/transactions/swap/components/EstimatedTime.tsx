import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

interface EstimatedTimeProps {
  timeMs?: number
  visibleIfLong?: boolean
}

export function EstimatedTime({ timeMs, visibleIfLong }: EstimatedTimeProps): JSX.Element | null {
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

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {t('swap.bridging.estimatedTime')}
      </Text>
      <Text adjustsFontSizeToFit color="$neutral1" numberOfLines={1} variant="body3">
        {estimatedBridgingTime}
      </Text>
    </Flex>
  )
}
