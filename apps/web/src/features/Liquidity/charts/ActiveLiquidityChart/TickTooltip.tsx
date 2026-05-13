import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { LiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart/types'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'

export function shouldShowSinglePrice(params: {
  showSingleTick: boolean | undefined
  formattedPriceLow: string | undefined
  formattedPriceHigh: string | undefined
}): boolean {
  const { showSingleTick, formattedPriceLow, formattedPriceHigh } = params
  return (
    Boolean(showSingleTick) ||
    formattedPriceLow === undefined ||
    formattedPriceHigh === undefined ||
    formattedPriceLow === formattedPriceHigh
  )
}

export function getPricePairLabel(params: { quoteSymbol: string | undefined; baseSymbol: string | undefined }): string {
  const { quoteSymbol, baseSymbol } = params
  return quoteSymbol && baseSymbol ? `${quoteSymbol}/${baseSymbol}` : (quoteSymbol ?? '')
}

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
  priceInverted,
  protocolVersion,
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
  priceInverted: boolean
  protocolVersion: ProtocolVersion
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
      priceInverted={priceInverted}
      protocolVersion={protocolVersion}
    />
  )
}

function CurrencyAmountRow({
  currency,
  lockedUSD,
  lockedPercent,
  densityPerBpsUSD,
}: {
  currency: Currency
  lockedUSD: CurrencyAmount<Currency>
  lockedPercent: number | string
  densityPerBpsUSD?: number
}) {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex gap="$gap2">
      <Flex justifyContent="space-between" row alignItems="center" gap="$gap8">
        <Flex row gap="$gap4" alignItems="center">
          <DoubleCurrencyLogo currencies={[currency]} size={iconSizes.icon16} />
          <Text variant="body4">{currency.symbol}</Text>
        </Flex>
        <Flex row alignItems="center" gap="$gap4">
          <Text variant="body4">{convertFiatAmountFormatted(lockedUSD.toExact(), NumberType.FiatTokenStats)}</Text>
          <Text variant="body4" color="$neutral2">
            {formatPercent(lockedPercent)}
          </Text>
        </Flex>
      </Flex>
      {densityPerBpsUSD !== undefined && Number.isFinite(densityPerBpsUSD) && densityPerBpsUSD > 0 && (
        <Flex row justifyContent="flex-end">
          <Text variant="body4" color="$neutral2">
            {t('chart.density.perBps', {
              value: convertFiatAmountFormatted(densityPerBpsUSD.toString(), NumberType.FiatTokenStats),
            })}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

// oxlint-disable-next-line complexity
export function TickTooltipContent({
  currentPrice,
  hoveredTick,
  currentTick,
  quoteCurrency,
  baseCurrency,
  tickSpacing = 60,
  showQuoteCurrencyFirst = true,
  priceInverted,
  protocolVersion,
  ...props
}: {
  currentPrice: number
  hoveredTick: ChartEntry | LiquidityBarData
  currentTick?: number
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  tickSpacing?: number
  showQuoteCurrencyFirst?: boolean
  priceInverted: boolean
  protocolVersion: ProtocolVersion
} & FlexProps) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
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

  // Segment is the natural "bin" of constant active liquidity — use it for the
  // displayed price range and per-bps density. 1 tick = 1 bps in v3/v4.
  const segment = 'segment' in hoveredTick ? hoveredTick.segment : undefined
  const segmentBps = segment ? Math.abs(segment.endTick - segment.startTick) : 0

  // Only show a single tick when the segment collapses to one tickSpacing
  const showSingleTick = segment && segmentBps / tickSpacing === 1

  const segmentPriceA = segment
    ? getDisplayPriceFromTick({
        tick: segment.startTick,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })
    : undefined
  const segmentPriceB = segment
    ? getDisplayPriceFromTick({
        tick: segment.endTick,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })
    : undefined

  // Inversion can flip ordering — always render low → high.
  const [priceLow, priceHigh] =
    segmentPriceA !== undefined && segmentPriceB !== undefined && segmentPriceA > segmentPriceB
      ? [segmentPriceB, segmentPriceA]
      : [segmentPriceA, segmentPriceB]

  const formatPrice = (value: number): string => formatNumberOrString({ value, type: NumberType.TokenTx })

  const formattedPriceLow = priceLow !== undefined ? formatPrice(priceLow) : undefined
  const formattedPriceHigh = priceHigh !== undefined ? formatPrice(priceHigh) : undefined

  // Adjacent ticks can format to the same display string (e.g., both round to "0.00074").
  // Collapse to a single price in that case so we don't render "X to X".
  const showSinglePrice = shouldShowSinglePrice({
    showSingleTick,
    formattedPriceLow,
    formattedPriceHigh,
  })

  const pricePairLabel = getPricePairLabel({
    quoteSymbol: quoteCurrency.symbol,
    baseSymbol: baseCurrency.symbol,
  })

  const priceSuffix = pricePairLabel ? (
    <Text variant="body4" color="$neutral2">
      {' '}
      {pricePairLabel}
    </Text>
  ) : null

  const quoteDensity =
    amountQuoteLockedUSD && segmentBps > 0 ? Number(amountQuoteLockedUSD.toExact()) / segmentBps : undefined
  const baseDensity =
    amountBaseLockedUSD && segmentBps > 0 ? Number(amountBaseLockedUSD.toExact()) / segmentBps : undefined

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
      {segment && (
        <Flex row alignItems="center" justifyContent="space-between" gap="$gap8">
          {showSinglePrice ? (
            <Text variant="body4" color="$neutral2">
              {priceLow !== undefined ? (
                <>
                  {formatPrice(priceLow)}
                  {priceSuffix}
                </>
              ) : (
                <>
                  {t('common.tick')}: <Text variant="body4">{hoveredTick.tick}</Text>
                </>
              )}
            </Text>
          ) : (
            <Flex row alignItems="center" gap="$gap4">
              <Text variant="body4">{formattedPriceLow}</Text>
              <Text variant="body4" color="$neutral2">
                {t('common.to')}
              </Text>
              <Text variant="body4">{formattedPriceHigh}</Text>
              <Text variant="body4" color="$neutral2">
                {pricePairLabel}
              </Text>
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
      )}
      {(showQuoteCurrency || isCurrentTick) && amountQuoteLockedUSD && (
        <CurrencyAmountRow
          currency={quoteCurrency}
          lockedUSD={amountQuoteLockedUSD}
          lockedPercent={
            isCurrentTick && amountBaseLockedUSD
              ? new Percent(
                  amountQuoteLockedUSD.quotient,
                  amountBaseLockedUSD.add(amountQuoteLockedUSD).quotient,
                ).toSignificant()
              : 100
          }
          densityPerBpsUSD={quoteDensity}
        />
      )}
      {(!showQuoteCurrency || isCurrentTick) && amountBaseLockedUSD && (
        <CurrencyAmountRow
          currency={baseCurrency}
          lockedUSD={amountBaseLockedUSD}
          lockedPercent={
            isCurrentTick && amountQuoteLockedUSD
              ? new Percent(
                  amountBaseLockedUSD.quotient,
                  amountQuoteLockedUSD.add(amountBaseLockedUSD).quotient,
                ).toSignificant()
              : 100
          }
          densityPerBpsUSD={baseDensity}
        />
      )}
    </Flex>
  )
}
