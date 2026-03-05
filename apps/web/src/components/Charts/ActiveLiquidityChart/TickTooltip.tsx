import { Currency, Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'
import { LiquidityBarData } from '~/components/Charts/LiquidityChart/types'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'

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
  tickSpacing,
}: {
  hoverY: number
  hoveredTick: ChartEntry | LiquidityBarData
  currentPrice: number
  currentTick?: number
  containerHeight: number
  contentWidth: number
  axisLabelPaneWidth: number
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  tickSpacing?: number
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
      tickSpacing={tickSpacing}
    />
  )
}

export function TickTooltipContent({
  currentPrice,
  hoveredTick,
  currentTick,
  quoteCurrency,
  baseCurrency,
  tickSpacing = 60,
  showQuoteCurrencyFirst = true,
  ...props
}: {
  currentPrice: number
  hoveredTick: ChartEntry | LiquidityBarData
  currentTick?: number
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  tickSpacing?: number
  showQuoteCurrencyFirst?: boolean
} & FlexProps) {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const amountBaseLockedUSD = useUSDCValue(
    tryParseCurrencyAmount(hoveredTick.amount1Locked?.toFixed(baseCurrency?.decimals ?? 0), baseCurrency),
  )
  const amountQuoteLockedUSD = useUSDCValue(
    tryParseCurrencyAmount(hoveredTick.amount0Locked?.toFixed(quoteCurrency?.decimals ?? 0), quoteCurrency),
  )

  const price0 = typeof hoveredTick.price0 === 'string' ? parseFloat(hoveredTick.price0) : hoveredTick.price0
  const showQuoteCurrency = showQuoteCurrencyFirst ? currentPrice >= price0 : currentPrice <= price0

  if (!amountBaseLockedUSD && !amountQuoteLockedUSD) {
    return null
  }

  if (!quoteCurrency || !baseCurrency) {
    return null
  }

  // Check if current tick falls within this bucket's range
  const isCurrentTick =
    'bucket' in hoveredTick
      ? currentTick !== undefined &&
        hoveredTick.bucket?.startTick !== undefined &&
        currentTick >= hoveredTick.bucket.startTick &&
        currentTick < hoveredTick.bucket.endTick
      : hoveredTick.tick === currentTick

  // Only show 1 tick if the bucket size is 1
  const showSingleTick =
    'bucket' in hoveredTick &&
    hoveredTick.bucket &&
    Math.abs(hoveredTick.bucket.startTick - hoveredTick.bucket.endTick) / tickSpacing === 1

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
      {'bucket' in hoveredTick && hoveredTick.bucket && hoveredTick.segment && (
        <Flex>
          <Flex row alignItems="center" justifyContent="space-between" gap="$gap8">
            {showSingleTick ? (
              <Flex row alignItems="center" gap="$gap4">
                <Text variant="body4" color="$neutral2">
                  {t('common.tick')}: <Text variant="body4">{hoveredTick.tick}</Text>
                </Text>
              </Flex>
            ) : (
              <Flex row alignItems="center" gap="$gap4">
                <Text variant="body4" color="$neutral2">
                  {t('common.ticks')}:
                </Text>
                <Text variant="body4">{hoveredTick.bucket.startTick.toLocaleString()}</Text>
                <Text variant="body4" color="$neutral2">
                  {t('common.to')}
                </Text>
                <Text variant="body4">{hoveredTick.bucket.endTick.toLocaleString()}</Text>
              </Flex>
            )}
            {isCurrentTick && (
              <Flex px="$padding6" py="$spacing2" borderRadius="$rounded8" backgroundColor="$accent2">
                <Text variant="body4" color="$accent1">
                  {t('common.current')}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      )}
      {(showQuoteCurrency || isCurrentTick) && amountQuoteLockedUSD && (
        <Flex gap="$gap4">
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
        </Flex>
      )}
      {(!showQuoteCurrency || isCurrentTick) && amountBaseLockedUSD && (
        <Flex gap="$gap4">
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
        </Flex>
      )}
    </Flex>
  )
}
