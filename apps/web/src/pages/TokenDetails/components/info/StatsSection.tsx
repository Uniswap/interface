import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { TokenQueryData } from '~/appGraphql/data/Token'
import { getHeaderDescription, TokenSortMethod } from '~/components/Tokens/constants'
import { MouseoverTooltip } from '~/components/Tooltip'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPStatsMarketSource } from '~/pages/TokenDetails/hooks/useTDPStatsMarketSource'

const STATS_GAP = '$gap20'

export const StatWrapper = ({
  tableRow = false,
  children,
  ...props
}: { tableRow?: boolean; children: ReactNode } & FlexProps) => (
  <Flex
    tag={tableRow ? 'tr' : 'div'}
    flexBasis="33.33%"
    flexGrow={0}
    flexShrink={0}
    pr="$spacing12"
    $sm={{ flexBasis: '50%' }}
    {...props}
  >
    {children}
  </Flex>
)

export const StatsWrapper = ({ children, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex animation="200ms" animateEnter="fadeIn" gap={STATS_GAP} {...props}>
    {children}
  </Flex>
)

const TokenStatsSection = ({ children }: { children: ReactNode }) => (
  <Flex row flexWrap="wrap" rowGap="$spacing24" tag="table">
    {children}
  </Flex>
)

type NumericStat = number | undefined | null

function Stat({
  testID,
  value,
  title,
  description,
  numberType = NumberType.FiatTokenStats,
}: {
  testID: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
  numberType?: FiatNumberType
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <StatWrapper tableRow data-cy={`${testID}`} data-testid={`${testID}`}>
      <Text variant="body3" color="$neutral2" tag="td">
        <MouseoverTooltip disabled={!description} text={description}>
          {title}
        </MouseoverTooltip>
      </Text>
      <Text
        tag="td"
        mt="$spacing8"
        fontSize={28}
        color="$neutral1"
        fontWeight="$book"
        $platform-web={{
          overflowWrap: 'break-word',
        }}
      >
        {convertFiatAmountFormatted(value, numberType)}
      </Text>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  tokenQueryData: TokenQueryData | undefined
}

export function StatsSection({ tokenQueryData }: StatsSectionProps) {
  const { t } = useTranslation()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const effectiveCurrency = useTDPEffectiveCurrency()

  const { showAggregatedStats, filteredDeploymentMarket, networkFilterName, marketStatsInput } =
    useTDPStatsMarketSource(tokenQueryData)

  const currencyIdValue = useMemo(() => currencyId(effectiveCurrency), [effectiveCurrency])
  const spotPrice = useTokenSpotPrice(currencyIdValue)

  const stats = useTokenMarketStats(currencyIdValue, {
    aggregatedData: marketStatsInput,
    currentPriceOverride: spotPrice,
  })

  const volume =
    (showAggregatedStats ? tokenQueryData?.market?.volume24H?.value : filteredDeploymentMarket?.volume24H?.value) ??
    stats.volume
  const tvl = showAggregatedStats
    ? tokenQueryData?.market?.totalValueLocked?.value
    : filteredDeploymentMarket?.totalValueLocked?.value
  const { marketCap, fdv, high52w, low52w } = stats

  const hasStats = tvl || fdv || marketCap || volume || high52w || low52w

  if (hasStats) {
    return (
      <StatsWrapper data-testid={TestID.TokenDetailsStats}>
        <Text variant="heading3">{t('common.stats')}</Text>
        <TokenStatsSection>
          <Stat
            testID={TestID.TokenDetailsStatsTvl}
            value={tvl}
            description={
              multichainTokenUxEnabled && networkFilterName
                ? t('stats.tvl.description.network', {
                    symbol: effectiveCurrency.symbol,
                    network: networkFilterName,
                  })
                : t('stats.tvl.description', { symbol: effectiveCurrency.symbol })
            }
            title={t('common.totalValueLocked')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsMarketCap}
            value={marketCap}
            description={t('stats.marketCap.description')}
            title={t('stats.marketCap')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsFdv}
            value={fdv}
            description={getHeaderDescription({ t, category: TokenSortMethod.FULLY_DILUTED_VALUATION })}
            title={t('stats.fdv')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsVolume24h}
            value={volume}
            description={
              effectiveCurrency.chainId === UniverseChainId.Tempo
                ? t('stats.volume.1d.description.tempo')
                : t('stats.volume.1d.description')
            }
            title={t('stats.volume.1d')}
          />
          <Stat
            testID={TestID.TokenDetailsStats52wHigh}
            value={high52w}
            title={t('token.stats.priceHighYear')}
            numberType={NumberType.FiatTokenDetails}
          />
          <Stat
            testID={TestID.TokenDetailsStats52wLow}
            value={low52w}
            title={t('token.stats.priceLowYear')}
            numberType={NumberType.FiatTokenDetails}
          />
        </TokenStatsSection>
      </StatsWrapper>
    )
  }
  return (
    <Text color="$neutral3" pt="$spacing40" data-cy="token-details-no-stats-data">
      {t('stats.noStatsAvailable')}
    </Text>
  )
}
