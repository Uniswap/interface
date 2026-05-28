import { memo, useState } from 'react'
import { Flex, Text, TouchableArea, type ColorTokens } from 'ui/src'
import type { CapturedAnalyticsEvent } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'
import { useEvent } from 'utilities/src/react/hooks'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function PropertySection({
  title,
  properties,
  color,
}: {
  title: string
  properties: Record<string, unknown>
  color: ColorTokens
}): JSX.Element | null {
  const entries = Object.entries(properties)
  if (entries.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing2" mt="$spacing4">
      <Text variant="body4" color={color} opacity={0.7}>
        {title}
      </Text>
      {entries.map(([key, value]) => (
        <Flex key={key} row gap="$spacing4" pl="$spacing8">
          <Text variant="body4" color="$neutral2" flexShrink={0}>
            {key}:
          </Text>
          <Text variant="body4" color="$neutral1" flexShrink={1} numberOfLines={2}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}

interface AnalyticsDebugEventRowProps {
  event: CapturedAnalyticsEvent
  detailLevel: 1 | 2 | 3
}

export const AnalyticsDebugEventRow = memo(function AnalyticsDebugEventRow({
  event,
  detailLevel,
}: AnalyticsDebugEventRowProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  return (
    <TouchableArea onPress={toggleExpanded}>
      <Flex
        borderBottomWidth={1}
        borderBottomColor="$surface3"
        py="$spacing4"
        px="$spacing8"
        hoverStyle={{ backgroundColor: '$surface2' }}
      >
        {/* Collapsed: timestamp + event name */}
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="body4" color="$neutral3" flexShrink={0}>
            {formatTime(event.timestamp)}
          </Text>
          <Text variant="body3" color="$neutral1" flexShrink={1} numberOfLines={1}>
            {event.eventName}
          </Text>
        </Flex>

        {/* Expanded: show properties based on detail level */}
        {isExpanded && (
          <Flex mt="$spacing4" pl="$spacing4">
            {/* Tier 1: Custom properties (always shown when expanded) */}
            <PropertySection title="Properties" properties={event.customProperties} color="$neutral2" />

            {/* Tier 2: Trace context */}
            {detailLevel >= 2 && (
              <PropertySection title="Trace Context" properties={event.traceProperties} color="$accent1" />
            )}

            {/* Tier 3: Amplitude metadata */}
            {detailLevel >= 3 && event.amplitudeMetadata && (
              <PropertySection title="Amplitude Metadata" properties={event.amplitudeMetadata} color="$neutral3" />
            )}
          </Flex>
        )}
      </Flex>
    </TouchableArea>
  )
})
