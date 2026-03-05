import { memo, useMemo } from 'react'
import { Flex, Text, TextProps } from 'ui/src'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'
import { FORMAT_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { GroupHoverTransition } from '~/components/GroupHoverTransition'

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
    <GroupHoverTransition
      showTransition={showFullDateOnHover}
      height={CELL_HEIGHT}
      defaultContent={
        <Flex
          height={CELL_HEIGHT}
          justifyContent="center"
          alignItems={textAlign === 'right' ? 'flex-end' : 'flex-start'}
        >
          <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
            {formattedTime}
          </Text>
        </Flex>
      }
      hoverContent={
        <Flex height={CELL_HEIGHT} justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
            {dateLine} {timeLine}
          </Text>
        </Flex>
      }
    />
  )
}

export const TimeCell = memo(_TimeCell)
