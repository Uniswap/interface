import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { useSwapsThisWeek } from 'pages/Portfolio/Overview/hooks/useSwapsThisWeek'
import { useTranslation } from 'react-i18next'
import { EM_DASH, Flex, styled, Text, useMedia } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const BORDER_COLOR = '$surface3'
const BORDER_WIDTH = 1

const StatsContainer = styled(Flex, {
  borderWidth: BORDER_WIDTH,
  borderColor: BORDER_COLOR,
  borderRadius: '$rounded16',
  overflow: 'hidden',
  variants: {
    singleRow: {
      true: {
        flexDirection: 'row',
      },
    },
  } as const,
})

const StatsGroup1 = styled(Flex, {
  flexDirection: 'row',
  borderColor: BORDER_COLOR,
  borderBottomWidth: 1,
  variants: {
    singleRow: {
      true: {
        borderBottomWidth: 0,
        borderRightWidth: 1,
        width: '50%',
      },
    },
  } as const,
})

const StatsGroup2 = styled(Flex, {
  flexDirection: 'row',
  variants: {
    singleRow: {
      true: {
        width: '50%',
      },
    },
  } as const,
})

export function OverviewStatsTiles() {
  const { t } = useTranslation()
  const media = useMedia()
  const isSingleRow = !!media.xl && !media.md
  const { count: swapCount, totalVolumeUSD, isLoading } = useSwapsThisWeek()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const hasVolumeData = totalVolumeUSD > 0

  return (
    <StatsContainer singleRow={isSingleRow}>
      <StatsGroup1 singleRow={isSingleRow}>
        <Flex borderRightWidth={BORDER_WIDTH} borderColor={BORDER_COLOR} padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.swapsThisWeek')}
          </Text>
          <Text variant="heading3" loading={isLoading} color="$neutral1">
            {swapCount}
          </Text>
        </Flex>
        <Flex padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.swappedThisWeek')}
          </Text>
          <ValueWithFadedDecimals
            textProps={{ variant: 'heading3', color: '$neutral1' }}
            value={hasVolumeData ? convertFiatAmountFormatted(totalVolumeUSD, NumberType.PortfolioBalance) : EM_DASH}
          />
        </Flex>
      </StatsGroup1>
      <StatsGroup2 singleRow={isSingleRow}>
        <Flex borderRightWidth={BORDER_WIDTH} borderColor={BORDER_COLOR} padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.averageSwapSize')}
          </Text>
          <ValueWithFadedDecimals textProps={{ variant: 'heading3', color: '$neutral1' }} value={EM_DASH} />
        </Flex>
        <Flex padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.totalSwapVolume')}
          </Text>
          <ValueWithFadedDecimals textProps={{ variant: 'heading3', color: '$neutral1' }} value={EM_DASH} />
        </Flex>
      </StatsGroup2>
    </StatsContainer>
  )
}
