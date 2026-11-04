import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'

export type MarginPositionCardMetric = {
  key: string
  label: string
  value: ReactNode
}

/**
 * One position as a card: the positions table's columns, re-flowed for a phone. The header row carries
 * the pair identity and a trailing slot (age, chevron); under a hairline the figures sit two to a row.
 * Layout only: every cell is rendered by the caller, so the card and the table cannot read a position
 * differently.
 */
export function MarginPositionCard({
  identity,
  trailing,
  metrics,
  onPress,
}: {
  identity: ReactNode
  trailing?: ReactNode
  metrics?: MarginPositionCardMetric[]
  onPress?: () => void
}): JSX.Element {
  return (
    <Flex
      width="100%"
      borderRadius="$rounded16"
      borderWidth={1}
      borderColor="$surface3"
      backgroundColor="$surface1"
      overflow="hidden"
      testID={TestID.MarginPositionCard}
    >
      <TouchableArea onPress={onPress} disabled={!onPress}>
        <Flex px="$spacing16" py="$spacing12" gap="$spacing12">
          <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
            <Flex flex={1} minWidth={0}>
              {identity}
            </Flex>
            {trailing ? (
              <Flex row alignItems="center" gap="$spacing8" flexShrink={0}>
                {trailing}
              </Flex>
            ) : null}
          </Flex>
          {metrics && metrics.length > 0 ? (
            <>
              <Flex height={1} backgroundColor="$surface3" />
              <Flex row flexWrap="wrap" rowGap="$spacing12">
                {metrics.map((metric) => (
                  <Flex key={metric.key} width="50%" gap="$spacing4" alignItems="flex-start">
                    <Text variant="body4" color="$neutral2">
                      {metric.label}
                    </Text>
                    {metric.value}
                  </Flex>
                ))}
              </Flex>
            </>
          ) : null}
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

/** Stand-in cards for the positions' first load. */
export function MarginPositionCardSkeletons({ count }: { count: number }): JSX.Element {
  return (
    <Flex gap="$spacing12" width="100%">
      {Array.from({ length: count }, (_, index) => (
        <Flex key={index} height={132} borderRadius="$rounded16" backgroundColor="$surface2" />
      ))}
    </Flex>
  )
}
