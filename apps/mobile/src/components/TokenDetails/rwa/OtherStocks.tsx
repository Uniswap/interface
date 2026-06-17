import { FeatureFlags } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import Svg, { Path } from 'react-native-svg'
import { computeChartPaths } from 'src/components/home/PortfolioChart/sparklineUtils'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'
import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/rest/rwa/sparklineUtils'
import type { ExploreStockShelfItem, RwaSparkline } from 'uniswap/src/data/rest/rwa/types'
import { useExploreStocks } from 'uniswap/src/data/rest/rwa/useExploreStocks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

const STOCK_CARD_WIDTH = 204
const SPARKLINE_WIDTH = 64
const SPARKLINE_HEIGHT = 36

const LIST_CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: spacing.spacing16,
}

export function OtherStocks(): JSX.Element | null {
  const { t } = useTranslation()
  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdpRelatedTokens)
  const { featured } = useExploreStocks([], {
    enabled: Boolean(rwaMatch),
    excludeSymbol: rwaMatch?.asset.symbol,
  })

  if (!rwaMatch || featured.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing12" testID={TestID.TokenDetailsRWARelatedTokens}>
      <Text color="$neutral2" mx="$spacing24" variant="subheading2">
        {t('tdp.rwa.otherStocks')}
      </Text>
      <FlatList
        horizontal
        contentContainerStyle={LIST_CONTENT_CONTAINER_STYLE}
        data={featured}
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
}

const renderItem = ({ item }: { item: ExploreStockShelfItem }): JSX.Element => <StockCard item={item} />

function keyExtractor(item: ExploreStockShelfItem): string {
  return item.rwa.symbol
}

function ItemSeparatorComponent(): JSX.Element {
  return <Flex width="$spacing12" />
}

const StockCard = memo(function StockCard({ item }: { item: ExploreStockShelfItem }): JSX.Element {
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { chains: enabledChainIds } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { rwa, issuer } = item
  const primaryChain = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  const priceLabel = convertFiatAmountFormatted(issuer.priceUsd, NumberType.FiatTokenPrice)
  const change = issuer.priceChange24hPct

  const onPress = (): void => {
    if (!primaryChain?.address) {
      return
    }
    const currencyId = buildCurrencyId(primaryChain.chainId as UniverseChainId, primaryChain.address)
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  return (
    <TouchableArea
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing12"
      width={STOCK_CARD_WIDTH}
      onPress={primaryChain ? onPress : undefined}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <TokenLogo hideNetworkLogo url={rwa.logoUrl} symbol={rwa.symbol} name={rwa.name} size={32} />
        <RwaMiniSparkline sparkline={issuer.sparkline1d} isNegative={(change ?? 0) < 0} />
      </Flex>
      <Flex gap="$spacing2">
        <Flex row alignItems="baseline" gap="$spacing8">
          <Text color="$neutral1" flexShrink={1} numberOfLines={1} variant="body2">
            {rwa.name}
          </Text>
          <Text color="$neutral3" numberOfLines={1} variant="body4">
            {formatIssuerLabel(issuer.issuer)}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing4">
          <Text color="$neutral1" numberOfLines={1} variant="body3">
            {priceLabel}
          </Text>
          {change !== undefined ? <RelativeChange arrowSize="$icon.12" change={change} variant="body3" /> : null}
        </Flex>
      </Flex>
    </TouchableArea>
  )
})

function RwaMiniSparkline({
  sparkline,
  isNegative,
}: {
  sparkline: RwaSparkline
  isNegative: boolean
}): JSX.Element | null {
  const colors = useSporeColors()
  const data = useMemo(() => rwaSparklineToChartPoints(sparkline), [sparkline])
  const { linePath, areaPath } = useMemo(
    () => computeChartPaths({ data, dataWidth: SPARKLINE_WIDTH, height: SPARKLINE_HEIGHT, yGutter: 2 }),
    [data],
  )

  if (!linePath) {
    return null
  }

  const color = isNegative ? colors.statusCritical.val : colors.statusSuccess.val

  return (
    <Svg height={SPARKLINE_HEIGHT} width={SPARKLINE_WIDTH}>
      {areaPath ? <Path d={areaPath} fill={color} opacity={0.12} /> : null}
      <Path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </Svg>
  )
}
