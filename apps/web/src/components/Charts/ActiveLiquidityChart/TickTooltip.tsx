import { Currency, Percent } from '@uniswap/sdk-core'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export function TickTooltip({
  hoverY,
  hoveredTick,
  currentPrice,
  currentTick,
  contentWidth,
  axisLabelPaneWidth,
  quoteCurrency,
  baseCurrency,
}: {
  hoverY: number
  hoveredTick: ChartEntry
  currentPrice: number
  currentTick?: number
  contentWidth: number
  axisLabelPaneWidth: number
  quoteCurrency: Currency
  baseCurrency: Currency
}) {
  const { formatCurrencyAmount, formatPercent } = useFormatter()

  const amountBaseLockedUSD = useUSDCValue(tryParseCurrencyAmount(hoveredTick.amount1Locked?.toFixed(2), baseCurrency))
  const amountQuoteLockedUSD = useUSDCValue(
    tryParseCurrencyAmount(hoveredTick.amount0Locked?.toFixed(2), quoteCurrency),
  )

  if (!amountQuoteLockedUSD || !amountBaseLockedUSD) {
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
            <DoubleCurrencyLogo currencies={[quoteCurrency]} size={iconSizes.icon16} />
            <Text variant="body4">{quoteCurrency.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {formatCurrencyAmount({
                amount: amountQuoteLockedUSD,
                type: NumberType.FiatTokenStats,
              })}
            </Text>
            {amountBaseLockedUSD && (
              <Text variant="body4" color="$neutral2">
                {formatPercent(
                  hoveredTick.tick === currentTick
                    ? new Percent(amountQuoteLockedUSD.quotient, amountBaseLockedUSD.add(amountQuoteLockedUSD).quotient)
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
            <DoubleCurrencyLogo currencies={[baseCurrency]} size={iconSizes.icon16} />
            <Text variant="body4">{baseCurrency.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {formatCurrencyAmount({
                amount: amountBaseLockedUSD,
                type: NumberType.FiatTokenStats,
              })}
            </Text>
            {amountQuoteLockedUSD && (
              <Text variant="body4" color="$neutral2">
                {formatPercent(
                  hoveredTick.tick === currentTick
                    ? new Percent(amountBaseLockedUSD.quotient, amountQuoteLockedUSD.add(amountBaseLockedUSD).quotient)
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
