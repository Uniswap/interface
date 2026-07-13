import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'
import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/rest/rwa/sparklineUtils'
import type { ExploreStockShelfItem } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import {
  ASSET_CARD_SPARKLINE_HEIGHT,
  ASSET_CARD_SPARKLINE_WIDTH,
  assetCardShellProps,
} from '~/pages/Explore/rwa/shelf/assetCardConstants'
import type { AssetCardClickHandler } from '~/pages/Explore/rwa/shelf/types'
import { AssetSparkline } from '~/pages/Explore/rwa/table/AssetSparkline'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export function AssetCard({
  rwa,
  issuer,
  cardWidth,
  onAssetClick,
}: ExploreStockShelfItem & { cardWidth: number; onAssetClick?: AssetCardClickHandler }): JSX.Element {
  const navigate = useNavigate()
  const { chains: enabledChainIds } = useEnabledChains()
  const exploreFilterChainId = useChainIdFromUrlParam()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  const change = issuer.priceChange24hPct
  const priceLabel = convertFiatAmountFormatted(issuer.priceUsd, NumberType.FiatTokenPrice)
  const sparklineData = rwaSparklineToChartPoints(issuer.sparkline1d)
  const primaryChain = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  const canNavigate = Boolean(primaryChain?.address)

  const onPress = useEvent((): void => {
    if (!primaryChain?.address) {
      return
    }
    onAssetClick?.({ tokenAddress: primaryChain.address, tokenSymbol: rwa.symbol })
    navigate(
      getTokenDetailsURL({
        address: primaryChain.address,
        chain: toGraphQLChain(primaryChain.chainId),
        chainQueryParam: exploreFilterChainId ? undefined : TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
      }),
    )
  })

  return (
    <TouchableArea
      {...assetCardShellProps}
      width={cardWidth}
      $platform-web={{ scrollSnapAlign: 'start' }}
      hoverStyle={canNavigate ? { backgroundColor: '$surface1Hovered' } : undefined}
      onPress={canNavigate ? onPress : undefined}
    >
      <Flex row alignItems="center" justifyContent="space-between" width="100%">
        <TokenLogo url={rwa.logoUrl} symbol={rwa.symbol} name={rwa.name} size={iconSizes.icon32} />
        <AssetSparkline
          data={sparklineData}
          isNegative={(change ?? 0) < 0}
          width={ASSET_CARD_SPARKLINE_WIDTH}
          height={ASSET_CARD_SPARKLINE_HEIGHT}
        />
      </Flex>
      <Flex gap="$spacing2" width="100%">
        <Flex row alignItems="baseline" gap="$spacing8" flexWrap="wrap">
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {rwa.name}
          </Text>
          <Text variant="body4" color="$neutral3" numberOfLines={1}>
            {formatIssuerLabel(issuer.issuer)}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral1" numberOfLines={1}>
            {priceLabel}
          </Text>
          {change !== undefined && (
            <Flex row alignItems="center" gap="$spacing2">
              <DeltaArrow delta={change} formattedDelta={formatPercent(Math.abs(change))} size={14} />
              <Text variant="body3" color="$neutral2">
                {formatPercent(Math.abs(change))}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
