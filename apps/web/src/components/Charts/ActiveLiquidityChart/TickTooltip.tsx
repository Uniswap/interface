import { Currency, Percent } from '@uniswap/sdk-core'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export function TickTooltip({
  hoverY,
  hoveredTick,
  currentPrice,
  currentTick,
  contentWidth,
  axisLabelPaneWidth,
  currency0,
  currency1,
}: {
  hoverY: number
  hoveredTick: ChartEntry
  currentPrice: number
  currentTick?: number
  contentWidth: number
  axisLabelPaneWidth: number
  currency0: Currency
  currency1: Currency
}) {
  const { formatCurrencyAmount, formatPercent } = useFormatter()

  const amount0LockedUSD = useUSDCValue(tryParseCurrencyAmount(hoveredTick.amount0Locked?.toFixed(2), currency0))
  const amount1LockedUSD = useUSDCValue(tryParseCurrencyAmount(hoveredTick.amount1Locked?.toFixed(2), currency1))

  if (!amount0LockedUSD || !amount1LockedUSD) {
    return null
  }

  return (
    <Flex
      position="absolute"
      p="$padding8"
      gap="$gap4"
      top={hoverY - 18}
      minWidth={150}
      right={contentWidth + axisLabelPaneWidth + 8}
      borderRadius="$rounded12"
      borderColor="$surface3"
      borderWidth="$spacing1"
      backgroundColor="$surface2"
      pointerEvents="none"
    >
      {(currentPrice >= hoveredTick.price0 || hoveredTick.tick === currentTick) && (
        <Flex justifyContent="space-between" row alignItems="center" gap="$gap8">
          <Flex row gap="$gap4" alignItems="center">
            <DoubleCurrencyLogo currencies={[currency0]} size={iconSizes.icon16} />
            <Text variant="body4">{currency0.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {formatCurrencyAmount({
                amount: amount0LockedUSD,
                type: NumberType.FiatTokenStats,
              })}
            </Text>
            {amount1LockedUSD && (
              <Text variant="body4" color="$neutral2">
                {formatPercent(
                  hoveredTick.tick === currentTick
                    ? new Percent(amount0LockedUSD.quotient, amount1LockedUSD.add(amount0LockedUSD).quotient)
                    : new Percent(1, 1),
                )}
              </Text>
            )}
          </Flex>
        </Flex>
      )}
      {(currentPrice <= hoveredTick.price0 || hoveredTick.tick === currentTick) && (
        <Flex justifyContent="space-between" row alignItems="center" gap="$gap8">
          <Flex row gap="$gap4" alignItems="center">
            <DoubleCurrencyLogo currencies={[currency1]} size={iconSizes.icon16} />
            <Text variant="body4">{currency1.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {formatCurrencyAmount({
                amount: amount1LockedUSD,
                type: NumberType.FiatTokenStats,
              })}
            </Text>
            {amount0LockedUSD && (
              <Text variant="body4" color="$neutral2">
                {formatPercent(
                  hoveredTick.tick === currentTick
                    ? new Percent(amount1LockedUSD.quotient, amount0LockedUSD.add(amount1LockedUSD).quotient)
                    : new Percent(1, 1),
                )}
              </Text>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
