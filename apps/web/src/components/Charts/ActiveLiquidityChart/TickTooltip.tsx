import { Currency, Percent } from '@uniswap/sdk-core'
import { LiquidityBarData } from 'components/Charts/LiquidityChart/types'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function TickTooltip({
  hoverY,
  hoveredTick,
  currentPrice,
  currentTick,
  containerHeight,
  contentWidth,
  axisLabelPaneWidth,
  quoteCurrency,
  baseCurrency,
}: {
  hoverY: number
  hoveredTick: ChartEntry | LiquidityBarData
  currentPrice: number
  currentTick?: number
  containerHeight: number
  contentWidth: number
  axisLabelPaneWidth: number
  quoteCurrency: Currency
  baseCurrency: Currency
}) {
  const atTop = hoverY < 20
  const atBottom = containerHeight - hoverY < 20

  return (
    <TickTooltipContent
      position="absolute"
      top={hoverY - 18}
      right={contentWidth + axisLabelPaneWidth + 8}
      transform={atBottom ? 'translateY(-12px)' : atTop ? 'translateY(14px)' : undefined}
      currentPrice={currentPrice}
      hoveredTick={hoveredTick}
      currentTick={currentTick}
      quoteCurrency={quoteCurrency}
      baseCurrency={baseCurrency}
    />
  )
}

export function TickTooltipContent({
  currentPrice,
  hoveredTick,
  currentTick,
  quoteCurrency,
  baseCurrency,
  showQuoteCurrencyFirst = true,
  ...props
}: {
  currentPrice: number
  hoveredTick: ChartEntry | LiquidityBarData
  currentTick?: number
  quoteCurrency: Currency
  baseCurrency: Currency
  showQuoteCurrencyFirst?: boolean
} & FlexProps) {
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const amountBaseLockedUSD = useUSDCValue(tryParseCurrencyAmount(hoveredTick.amount1Locked?.toFixed(2), baseCurrency))
  const amountQuoteLockedUSD = useUSDCValue(
    tryParseCurrencyAmount(hoveredTick.amount0Locked?.toFixed(2), quoteCurrency),
  )

  const price0 = typeof hoveredTick.price0 === 'string' ? parseFloat(hoveredTick.price0) : hoveredTick.price0
  const showQuoteCurrency = showQuoteCurrencyFirst ? currentPrice >= price0 : currentPrice <= price0
  const isCurrentTick = hoveredTick.tick === currentTick

  if (!amountBaseLockedUSD && !amountQuoteLockedUSD) {
    return null
  }

  return (
    <Flex
      p="$padding8"
      gap="$gap4"
      minWidth={150}
      borderRadius="$rounded12"
      borderColor="$surface3"
      borderWidth="$spacing1"
      backgroundColor="$surface2"
      pointerEvents="none"
      {...props}
    >
      {(showQuoteCurrency || isCurrentTick) && amountQuoteLockedUSD && (
        <Flex justifyContent="space-between" row alignItems="center" gap="$gap8">
          <Flex row gap="$gap4" alignItems="center">
            <DoubleCurrencyLogo currencies={[quoteCurrency]} size={iconSizes.icon16} />
            <Text variant="body4">{quoteCurrency.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {convertFiatAmountFormatted(amountQuoteLockedUSD.toExact(), NumberType.FiatTokenStats)}
            </Text>
            <Text variant="body4" color="$neutral2">
              {formatPercent(
                isCurrentTick && amountBaseLockedUSD
                  ? new Percent(
                      amountQuoteLockedUSD.quotient,
                      amountBaseLockedUSD.add(amountQuoteLockedUSD).quotient,
                    ).toSignificant()
                  : 100,
              )}
            </Text>
          </Flex>
        </Flex>
      )}
      {(!showQuoteCurrency || isCurrentTick) && amountBaseLockedUSD && (
        <Flex justifyContent="space-between" row alignItems="center" gap="$gap8">
          <Flex row gap="$gap4" alignItems="center">
            <DoubleCurrencyLogo currencies={[baseCurrency]} size={iconSizes.icon16} />
            <Text variant="body4">{baseCurrency.symbol}</Text>
          </Flex>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body4">
              {convertFiatAmountFormatted(amountBaseLockedUSD.toExact(), NumberType.FiatTokenStats)}
            </Text>
            <Text variant="body4" color="$neutral2">
              {formatPercent(
                isCurrentTick && amountQuoteLockedUSD
                  ? new Percent(
                      amountBaseLockedUSD.quotient,
                      amountQuoteLockedUSD.add(amountBaseLockedUSD).quotient,
                    ).toSignificant()
                  : 100,
              )}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
