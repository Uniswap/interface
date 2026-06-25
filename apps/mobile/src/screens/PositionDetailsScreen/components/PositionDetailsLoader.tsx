import { Flex, FlexLoader, Separator, Skeleton } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'

const STAT_ROW_COUNT = 4
const ALLOCATION_BAR_HEIGHT = 8

/**
 * Loading skeleton that mirrors PositionDetailsContent: hero (logo pair, pair name, value),
 * stats rows, and the token allocation breakdown. A single Skeleton wraps the tree so the
 * shimmer sweeps the whole screen at once.
 */
export function PositionDetailsLoader(): JSX.Element {
  return (
    <Skeleton>
      <Flex gap="$spacing20" pt="$spacing12" px="$spacing24" testID="position-details-loader">
        <Flex gap="$spacing20" width="100%">
          <Flex row alignItems="center" gap="$spacing16">
            <FlexLoader borderRadius="$roundedFull" height={iconSizes.icon48} width={iconSizes.icon48} />
            <Flex gap="$spacing6">
              <FlexLoader borderRadius="$rounded4" height={fonts.subheading1.lineHeight} width={140} />
              <FlexLoader borderRadius="$rounded4" height={fonts.body3.lineHeight} width={90} />
            </Flex>
          </Flex>
          <Flex gap="$spacing8">
            <FlexLoader borderRadius="$rounded8" height={fonts.heading2.lineHeight} width={160} />
            <FlexLoader borderRadius="$rounded4" height={fonts.body3.lineHeight} width={110} />
          </Flex>
        </Flex>

        <Flex gap="$spacing12" width="100%">
          {new Array(STAT_ROW_COUNT).fill(null).map((_, i) => (
            <Flex key={i} row alignItems="center" justifyContent="space-between">
              <FlexLoader borderRadius="$rounded4" height={fonts.body1.lineHeight} width={72} />
              <FlexLoader borderRadius="$rounded4" height={fonts.body1.lineHeight} width={88} />
            </Flex>
          ))}
        </Flex>

        <Separator />

        <Flex gap="$spacing16" width="100%">
          <Flex gap="$spacing8">
            <FlexLoader borderRadius="$rounded4" height={fonts.body3.lineHeight} width={80} />
            <FlexLoader borderRadius="$rounded8" height={fonts.heading3.lineHeight} width={130} />
          </Flex>
          <FlexLoader borderRadius="$roundedFull" height={ALLOCATION_BAR_HEIGHT} width="100%" />
          <Flex row alignItems="center" justifyContent="space-between">
            <FlexLoader borderRadius="$rounded4" height={fonts.body2.lineHeight} width={100} />
            <FlexLoader borderRadius="$rounded4" height={fonts.body2.lineHeight} width={100} />
          </Flex>
        </Flex>
      </Flex>
    </Skeleton>
  )
}
