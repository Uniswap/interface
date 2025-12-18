import { memo, useMemo } from 'react'
import { Flex, Text, TextProps } from 'ui/src'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'
import { FORMAT_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'

const FORMAT_DATE_WITH_WEEKDAY = 'ddd MMM D, YYYY'
const CELL_HEIGHT = 36

interface TimeCellProps {
  timestamp: number
  showFullDateOnHover?: boolean
  textAlign?: TextProps['textAlign']
}

function _TimeCell({ timestamp, showFullDateOnHover = false, textAlign = 'left' }: TimeCellProps) {
  const formattedTime = useFormattedTimeForActivity(timestamp)
  const localizedDayjs = useLocalizedDayjs()

  const { dateLine, timeLine } = useMemo(() => {
    const date = localizedDayjs(timestamp)
    return {
      dateLine: date.format(FORMAT_DATE_WITH_WEEKDAY),
      timeLine: date.format(FORMAT_TIME_SHORT),
    }
  }, [timestamp, localizedDayjs])

  return (
    <Flex position="relative" width="100%" overflow="hidden" height={CELL_HEIGHT}>
      <Flex
        position="absolute"
        justifyContent="center"
        transition={showFullDateOnHover ? 'all 0.1s ease-in-out' : undefined}
        flexDirection="column"
        y={0}
        $group-hover={showFullDateOnHover ? { y: -CELL_HEIGHT } : undefined}
        width="100%"
      >
        <Flex
          height={CELL_HEIGHT}
          justifyContent="center"
          alignItems={textAlign === 'right' ? 'flex-end' : 'flex-start'}
        >
          <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
            {formattedTime}
          </Text>
        </Flex>
        {showFullDateOnHover && (
          <Flex height={CELL_HEIGHT} justifyContent="center" alignItems="center">
            <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
              {dateLine} {timeLine}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export const TimeCell = memo(_TimeCell)
