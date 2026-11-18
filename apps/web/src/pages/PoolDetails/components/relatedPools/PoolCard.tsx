import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { areEvmAddressesEqual, type UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { tokenCardHoverStyle, tokenCardShellProps } from 'uniswap/src/components/TokenCard/constants'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type {
  RelatedPoolCardItem,
  RelatedPoolCardLeg,
} from 'uniswap/src/data/apiClients/dataApiService/relatedPools/relatedPoolMappers'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { NumberType } from 'utilities/src/format/types'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'

// Same rule as the pools table: v2/v3 can only hold wrapped native, so a WETH leg reads as ETH; v4 keeps
// the served symbol because it can hold both as distinct currencies.
function legSymbol({
  leg,
  chainId,
  protocolVersion,
}: {
  leg: RelatedPoolCardLeg
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
}): string {
  if (protocolVersion !== ProtocolVersion.V4) {
    const native = nativeOnChain(chainId)
    if (areEvmAddressesEqual(leg.address, native.wrapped.address)) {
      return native.symbol ?? leg.symbol ?? ''
    }
  }
  return leg.symbol ?? ''
}

/** Pool twin of the shared TokenCard for carousel surfaces: pair logos, version + fee badge, pair name, TVL. */
export const PoolCard = memo(function PoolCard({
  pool,
  width,
  testID,
  onPress,
}: {
  pool: RelatedPoolCardItem
  width: number
  testID?: string
  onPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const feeTier =
    pool.feeTier !== undefined
      ? { feeAmount: pool.feeTier, tickSpacing: pool.tickSpacing ?? 0, isDynamic: pool.isDynamicFee }
      : undefined

  return (
    <TouchableArea
      {...tokenCardShellProps}
      flexDirection="column"
      hoverStyle={onPress ? tokenCardHoverStyle : undefined}
      testID={testID}
      width={width}
      onPress={onPress}
    >
      <Flex row alignItems="flex-start" justifyContent="space-between" width="100%">
        <SplitLogo
          size={iconSizes.icon36}
          orientation="stacked"
          chainId={pool.chainId}
          inputCurrencyInfo={undefined}
          outputCurrencyInfo={undefined}
          inputLogoUrl={pool.token0.logoUrl}
          outputLogoUrl={pool.token1.logoUrl}
          inputFallbackSymbol={pool.token0.symbol}
          outputFallbackSymbol={pool.token1.symbol}
        />
        <Flex row gap="$spacing2">
          <LiquidityPositionInfoBadges
            version={pool.protocolVersion}
            chainId={pool.chainId}
            feeTier={feeTier}
            size="default"
          />
        </Flex>
      </Flex>
      <Flex gap="$spacing2" width="100%">
        <Text color="$neutral1" numberOfLines={1} variant="body2">
          {getPoolName({
            symbol0: legSymbol({ leg: pool.token0, chainId: pool.chainId, protocolVersion: pool.protocolVersion }),
            symbol1: legSymbol({ leg: pool.token1, chainId: pool.chainId, protocolVersion: pool.protocolVersion }),
          })}
        </Text>
        {pool.tvl !== undefined && (
          <Text color="$neutral2" numberOfLines={1} variant="body3">
            {t('pool.card.tvl', { tvl: convertFiatAmountFormatted(pool.tvl, NumberType.FiatTokenStats) })}
          </Text>
        )}
      </Flex>
    </TouchableArea>
  )
})
