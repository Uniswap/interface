// eslint-disable-next-line no-restricted-imports
import { LiquidityPositionFeeStats } from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { Flex, FlexProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityPositionCard({ liquidityPosition, ...rest }: { liquidityPosition: PositionInfo } & FlexProps) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const { fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering } =
    useV3OrV4PositionDerivedInfo(liquidityPosition)

  const token0USDValue = useUSDCValue(liquidityPosition.currency0Amount)
  const token1USDValue = useUSDCValue(liquidityPosition.currency1Amount)

  const v3OrV4FormattedUsdValue =
    fiatValue0 && fiatValue1
      ? formatCurrencyAmount({
          value: fiatValue0.add(fiatValue1),
          type: NumberType.FiatTokenPrice,
        })
      : undefined
  const v2FormattedUsdValue =
    token0USDValue && token1USDValue
      ? formatCurrencyAmount({ value: token0USDValue.add(token1USDValue), type: NumberType.FiatStandard })
      : undefined

  const v3OrV4FormattedFeesValue =
    fiatFeeValue0 && fiatFeeValue1
      ? formatCurrencyAmount({
          value: fiatFeeValue0.add(fiatFeeValue1),
          type: NumberType.FiatTokenPrice,
        })
      : undefined

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
        showReverseButton={false}
        formattedUsdValue={v3OrV4FormattedUsdValue ?? v2FormattedUsdValue}
        formattedUsdFees={v3OrV4FormattedFeesValue}
        priceOrdering={priceOrdering}
        feeTier={liquidityPosition.feeTier?.toString()}
        tickLower={liquidityPosition.tickLower}
        tickUpper={liquidityPosition.tickUpper}
        // TODO (WEB-4920): add total APR and fee APR
      />
    </Flex>
  )
}
