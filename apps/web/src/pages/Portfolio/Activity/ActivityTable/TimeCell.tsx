import { TableText } from 'components/Table/styled'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'
import { FORMAT_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'

const FORMAT_DATE_WITH_WEEKDAY = 'ddd MMM D, YYYY'

interface TimeCellProps {
  timestamp: number
  showFullDateOnHover?: boolean
}

export function TimeCell({ timestamp, showFullDateOnHover = false }: TimeCellProps) {
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
    <Flex
      position="relative"
      width="100%"
      justifyContent="center"
      alignItems="flex-start"
      overflow="hidden"
      height={36}
    >
      {/* Abbreviated time - slides down and fades out on group hover */}
      <TableText
        variant="body3"
        color="$neutral2"
        animation={showFullDateOnHover ? 'fast' : undefined}
        y={0}
        top={3}
        opacity={1}
        $group-hover={showFullDateOnHover ? { y: 10, opacity: 0 } : undefined}
      >
        {formattedTime}
      </TableText>
      {/* Full date - slides up from below and fades in on group hover */}
      {showFullDateOnHover && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          height="100%"
          justifyContent="center"
          flexDirection="column"
          gap={0}
          animation="fast"
          y={10}
          opacity={0}
          $group-hover={{ y: 0, opacity: 1 }}
        >
          <Text variant="body3" color="$neutral2">
            {dateLine}
          </Text>
          <Text variant="body3" color="$neutral2">
            {timeLine}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
