import { Flex, Text, TextCompatProps } from '@universe/mycelium'
import { memo, useContext, useMemo } from 'react'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { FORMAT_TIME_SHORT, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { COLLAPSE_PROGRESS, TEXT_FADE_END_PROGRESS } from '~/components/Table/PinnedColumns/collapse/utils'
import { TableRowHoverContext } from '~/components/Table/TableRowHoverContext'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'

const FORMAT_DATE_WITH_WEEKDAY = 'ddd MMM D, YYYY'
const CELL_HEIGHT = 36

// Cross-fade over the same progress window the collapsing logo cells use for their text. Opacity
// only: the full time stays in the accessibility tree, and the abbreviated stand-in is aria-hidden.
const FULL_TIME_FADE_OUT_STYLE = {
  opacity: `calc((${TEXT_FADE_END_PROGRESS} - ${COLLAPSE_PROGRESS}) / ${TEXT_FADE_END_PROGRESS})`,
}
const ABBREVIATED_TIME_FADE_IN_STYLE = { opacity: `calc(${COLLAPSE_PROGRESS} / ${TEXT_FADE_END_PROGRESS})` }

interface TimeCellProps {
  timestamp: number
  showFullDateOnHover?: boolean
  textAlign?: TextCompatProps['textAlign']
  /** Cross-fades into the abbreviated time ("3h") as the table's pinned column collapses (see `useCollapsiblePinnedColumn`). */
  collapsible?: boolean
}

function TimeCellInner({
  timestamp,
  showFullDateOnHover = false,
  textAlign = 'left',
  collapsible = false,
}: TimeCellProps) {
  const formattedTime = useFormattedTimeForActivity(timestamp)
  const localizedDayjs = useLocalizedDayjs()
  const rowHovered = useContext(TableRowHoverContext)

  const { dateLine, timeLine } = useMemo(() => {
    const date = localizedDayjs(timestamp)
    return {
      dateLine: date.format(FORMAT_DATE_WITH_WEEKDAY),
      timeLine: date.format(FORMAT_TIME_SHORT),
    }
  }, [timestamp, localizedDayjs])

  const hoverTransition = (
    <GroupHoverTransition
      showTransition={showFullDateOnHover}
      isHovered={rowHovered}
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
        <Flex
          height={CELL_HEIGHT}
          justifyContent="center"
          alignItems={textAlign === 'right' ? 'flex-end' : 'flex-start'}
        >
          <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
            {dateLine}
          </Text>
          <Text variant="body3" color="$neutral2" textAlign={textAlign} width="100%">
            {timeLine}
          </Text>
        </Flex>
      }
    />
  )

  if (!collapsible) {
    return hoverTransition
  }

  return (
    <Flex position="relative">
      <Flex style={FULL_TIME_FADE_OUT_STYLE}>{hoverTransition}</Flex>
      <Flex
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        justifyContent="center"
        aria-hidden
        style={ABBREVIATED_TIME_FADE_IN_STYLE}
      >
        <AbbreviatedTime timestamp={timestamp} />
      </Flex>
    </Flex>
  )
}

/** Its own component because the age ticks every second, which only the collapsed cell shows. */
function AbbreviatedTime({ timestamp }: { timestamp: number }) {
  const abbreviatedTime = useAbbreviatedTimeString(timestamp)
  return (
    <Text variant="body3" color="$neutral1">
      {abbreviatedTime}
    </Text>
  )
}

export const TimeCell = memo(TimeCellInner)
