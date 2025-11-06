import { TokenQueryData } from 'appGraphql/data/Token'
import { TokenSortMethod } from 'components/Tokens/state'
import { HEADER_DESCRIPTIONS } from 'components/Tokens/TokenTable'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text } from 'ui/src'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export const StatWrapper = ({ children, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex minWidth={121} flex={1} mr="$spacing12" pt="$spacing24" {...props}>
    {children}
  </Flex>
)

export const StatPair = ({ children, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex row flex={1} flexWrap="wrap" {...props}>
    {children}
  </Flex>
)

export const StatsWrapper = ({ children, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex animation="200ms" animateEnter="fadeIn" {...props}>
    {children}
  </Flex>
)

const TokenStatsSection = ({ children }: { children: ReactNode }) => (
  <Flex row flexWrap="wrap">
    {children}
  </Flex>
)

type NumericStat = number | undefined | null

function Stat({
  testID,
  value,
  title,
  description,
}: {
  testID: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <StatWrapper data-cy={`${testID}`} data-testid={`${testID}`}>
      <Text variant="body3" color="$neutral2">
        <MouseoverTooltip disabled={!description} text={description}>
          {title}
        </MouseoverTooltip>
      </Text>
      <Text
        mt="$spacing8"
        fontSize={28}
        color="$neutral1"
        fontWeight="$book"
        $platform-web={{
          overflowWrap: 'break-word',
        }}
      >
        {convertFiatAmountFormatted(value, NumberType.FiatTokenStats)}
      </Text>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  tokenQueryData: TokenQueryData
}
export default function StatsSection(props: StatsSectionProps) {
  const { tokenQueryData } = props
  const { t } = useTranslation()
  const { currency } = useTDPContext()

  // Construct currencyId for shared hooks
  const currencyIdValue = useMemo(() => currencyId(currency), [currency])

  // Use shared hook for unified data fetching (CoinGecko-first strategy)
  const { marketCap, fdv } = useTokenMarketStats(currencyIdValue)

  // Volume and TVL come from tokenQueryData to avoid fragment timing issues
  // These are already loaded with the main TokenWebQuery
  const volume = tokenQueryData?.market?.volume24H?.value
  const tvl = tokenQueryData?.market?.totalValueLocked?.value

  const hasStats = tvl || fdv || marketCap || volume

  if (hasStats) {
    return (
      <StatsWrapper data-testid="token-details-stats">
        <Text variant="heading2" color="$neutral1" fontSize={28} pt="$spacing40">
          {t('common.stats')}
        </Text>
        <TokenStatsSection>
          <StatPair>
            <Stat
              testID="tvl"
              value={tvl}
              description={t('stats.tvl.description')}
              title={t('common.totalValueLocked')}
            />
            <Stat
              testID="market-cap"
              value={marketCap}
              description={t('stats.marketCap.description')}
              title={t('stats.marketCap')}
            />
          </StatPair>
          <StatPair>
            <Stat
              testID="fdv"
              value={fdv}
              description={HEADER_DESCRIPTIONS[TokenSortMethod.FULLY_DILUTED_VALUATION]}
              title={t('stats.fdv')}
            />
            <Stat
              testID="volume-24h"
              value={volume}
              description={t('stats.volume.1d.description')}
              title={t('stats.volume.1d')}
            />
          </StatPair>
        </TokenStatsSection>
      </StatsWrapper>
    )
  } else {
    return (
      <Text color="$neutral3" pt="$spacing40" data-cy="token-details-no-stats-data">
        {t('stats.noStatsAvailable')}
      </Text>
    )
  }
}
