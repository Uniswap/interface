import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

const PlaceholderBar = styled(Flex, {
  width: '100%',
  backgroundColor: '$surface2',
  borderTopLeftRadius: '$rounded6',
  borderTopRightRadius: '$rounded6',
  flexShrink: 1,
  flexGrow: 1,
  flexBasis: 0,
  mx: '$spacing2',
})

interface BidDistributionChartPlaceholderProps {
  height?: number
}

export function BidDistributionChartPlaceholder({ height = 400 }: BidDistributionChartPlaceholderProps) {
  const { t } = useTranslation()
  const shortestBarHeight = 20
  const patternIterations = 3

  const pattern = [1, 1.25, 1.5, 1.75, 1.75, 1.5]
  const barHeights = Array.from(
    { length: patternIterations * pattern.length },
    (_, i) => shortestBarHeight * pattern[i % pattern.length],
  )

  return (
    <Flex position="relative" width="100%" height={height} row alignItems="flex-end" pb="$spacing20" gap="$gap2">
      {barHeights.map((barHeight, index) => (
        <PlaceholderBar key={index} height={`${barHeight}%`} />
      ))}
      <Flex
        position="absolute"
        top="40%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={zIndexes.default}
        centered
      >
        <Text variant="body1" color="$neutral2">
          {t('toucan.auction.notStarted')}
        </Text>
      </Flex>
    </Flex>
  )
}
