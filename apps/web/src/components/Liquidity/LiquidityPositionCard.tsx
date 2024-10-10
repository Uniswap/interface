// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionFeeStats } from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { PositionInfo } from 'components/Liquidity/types'
import { useV3PositionDerivedInfo } from 'components/Liquidity/utils'
import { Flex, FlexProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityPositionCard({ liquidityPosition, ...rest }: { liquidityPosition: PositionInfo } & FlexProps) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const {
    fiatFeeValue0,
    fiatFeeValue1,
    fiatValue0,
    fiatValue1,
    priceOrdering: { priceLower, priceUpper },
  } = useV3PositionDerivedInfo(liquidityPosition)

  const token0USDValue = useUSDCValue(liquidityPosition.currency0Amount)
  const token1USDValue = useUSDCValue(liquidityPosition.currency1Amount)

  const v3FormattedUsdValue =
    fiatValue0 && fiatValue1
      ? formatCurrencyAmount({
          value: fiatValue0.add(fiatValue1),
          type: NumberType.FiatTokenPrice,
        })
      : '-'
  const v2FormattedUsdValue =
    token0USDValue && token1USDValue
      ? formatCurrencyAmount({ value: token0USDValue.add(token1USDValue), type: NumberType.FiatStandard })
      : '-'

  const v3FormattedFeesValue =
    fiatFeeValue0 && fiatFeeValue1
      ? formatCurrencyAmount({
          value: fiatFeeValue0.add(fiatFeeValue1),
          type: NumberType.FiatTokenPrice,
        })
      : '-'

  if (!liquidityPosition) {
    return null
  }

  return (
    <Flex
      p="$spacing24"
      gap="$spacing24"
      borderWidth={1}
      borderRadius="$rounded20"
      borderColor="$surface3"
      width="100%"
      overflow="hidden"
      {...rest}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <LiquidityPositionInfo positionInfo={liquidityPosition} />
        {/* TODO (WEB-4920): add the range chart */}
      </Flex>
      <LiquidityPositionFeeStats
        formattedUsdValue={v3FormattedUsdValue ?? v2FormattedUsdValue}
        formattedUsdFees={liquidityPosition.version === ProtocolVersion.V3 ? v3FormattedFeesValue : undefined}
        lowPrice={priceLower}
        highPrice={priceUpper}
        // TODO (WEB-4920): add total APR and fee APR
      />
    </Flex>
  )
}
