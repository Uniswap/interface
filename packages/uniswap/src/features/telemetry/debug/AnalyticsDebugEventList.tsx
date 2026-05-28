import { Flex, ScrollView, Text } from 'ui/src'
import { AnalyticsDebugEventRow } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugEventRow'
import type { CapturedAnalyticsEvent } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'

interface AnalyticsDebugEventListProps {
  events: CapturedAnalyticsEvent[]
  detailLevel: 1 | 2 | 3
}

export function AnalyticsDebugEventList({ events, detailLevel }: AnalyticsDebugEventListProps): JSX.Element {
  if (events.length === 0) {
    return (
      <Flex centered flex={1} py="$spacing16">
        <Text variant="body3" color="$neutral3">
          No events captured yet
        </Text>
        <Text variant="body4" color="$neutral3" mt="$spacing4">
          Perform actions in the app to see analytics events
        </Text>
      </Flex>
    )
  }

  return (
    <ScrollView flex={1}>
      <Flex>
        {events.map((event) => (
          <AnalyticsDebugEventRow key={event.id} event={event} detailLevel={detailLevel} />
        ))}
      </Flex>
    </ScrollView>
  )
}
