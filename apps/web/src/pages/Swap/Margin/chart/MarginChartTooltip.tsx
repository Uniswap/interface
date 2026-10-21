import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MEDIUM, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import type { PositionEconomics } from '~/pages/Swap/Margin/chart/marginChartMath'
import type { NearOverlay } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import { formatSignedFiat } from '~/pages/Swap/Margin/marginFormat'
import { marginUsdPnlAtPrice, type MarginUsdBasis } from '~/pages/Swap/Margin/marginUsdPnl'

// Crosshair payload as augmented by MarginPriceChartModel.onSeriesHover: the RAW hovered candle plus
// the overlay hit (when the crosshair sits on a line/marker/zone).
export type MarginTooltipData = PriceChartData & { nearOverlay?: NearOverlay }

const APPENDED_ROW_MAX_WIDTH = 240

// CandlestickTooltip + margin extras (spec F11/F24): a PnL-at-this-price row whenever a primary
// position exists, and — after the model's 300ms dwell — a plain-language explainer for the overlay
// under the cursor. Prices and dates come straight off the chart (they are chart
// geometry already on screen).
export function MarginChartTooltip({
  data,
  econ,
  usdBasis,
  direction,
  leverage,
  collateralSymbol,
}: {
  data: MarginTooltipData
  econ?: PositionEconomics
  usdBasis?: MarginUsdBasis
  direction: MarginDirection
  leverage?: string
  collateralSymbol: string
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const fiat = (value: number): string => convertFiatAmountFormatted(value, NumberType.FiatTokenPrice)

  const ohlcRows = [
    { label: t('chart.price.label.open'), value: fiat(data.open) },
    { label: t('chart.price.label.high'), value: fiat(data.high) },
    { label: t('chart.price.label.low'), value: fiat(data.low) },
    { label: t('chart.price.label.close'), value: fiat(data.close) },
  ]

  // A candle whose close is 0 (a thin or bad print) yields no PnL rather than a fabricated total loss.
  const pnl = usdBasis ? marginUsdPnlAtPrice({ basis: usdBasis, price: data.close }) : undefined
  const pnlRow = pnl
    ? t('margin.chart.hover.pnlAt', {
        price: fiat(data.close),
        pnl: formatSignedFiat({ value: pnl.pnlUsd, format: fiat }),
        // "≤" on the floor: past the liquidation price the loss is at least all of the margin.
        pct: `${pnl.floored ? '≤' : ''}${pnl.pnlPct >= 0 ? '+' : ''}${formatPercent(pnl.pnlPct, 2)}`,
      })
    : undefined

  const near = data.nearOverlay
  const explainerFor = (overlay: NearOverlay): string | undefined => {
    switch (overlay.role) {
      case 'mark':
        return t('margin.chart.explain.mark')
      case 'entry':
        // Only the primary line ('entry') owns the leverage explainer; a ghost ('entry-{subId}') would
        // borrow the primary's leverage, so suppress rather than show wrong data.
        return overlay.id === 'entry' && leverage !== undefined
          ? t('margin.chart.explain.entry', { leverage })
          : undefined
      case 'liq': {
        // Same primary-only gate: the direction/price copy is the primary's; a ghost 'liq-{subId}' suppresses.
        if (overlay.id !== 'liq') {
          return undefined
        }
        // Hoisted out of the outer t() options — the i18n extractor misses t() calls nested there.
        const liqDirection =
          direction === 'SHORT' ? t('margin.chart.explain.liq.rises') : t('margin.chart.explain.liq.falls')
        return t('margin.chart.explain.liq', { direction: liqDirection, price: fiat(overlay.price) })
      }
      case 'zone':
        return t('margin.chart.explain.zone')
      case 'breakEven':
        return t('margin.chart.explain.breakEven')
      case 'previewEntry':
        return t('margin.chart.explain.previewEntry')
      case 'previewLiq':
        return t('margin.chart.explain.previewLiq')
      case 'marker': {
        const marker = overlay.marker
        if (!marker) {
          return undefined
        }
        const price = fiat(marker.price)
        const date = localizedDayjs(marker.time * 1000).format(FORMAT_DATE_MEDIUM)
        if (marker.kind === 'decrease') {
          return t('margin.chart.marker.decreased', { price, date })
        }
        if (!econ) {
          return undefined
        }
        // True at-open size (costBasis.totalCollateralAtOpen); fall back to current collateral only if the
        // server couldn't attribute it (0).
        const openedSize = econ.collateralAtOpen > 0 ? econ.collateralAtOpen : econ.collateral
        const size = `${formatNumberOrString({ value: openedSize, type: NumberType.TokenNonTx })} ${collateralSymbol}`
        return t('margin.chart.marker.opened', { size, price, date })
      }
      default:
        return undefined
    }
  }
  const explainer = near?.dwellElapsed ? explainerFor(near) : undefined

  return (
    <Text variant="body3" color="$neutral1">
      {/* Row shape matches CandlestickTooltip (fixed-shape component, not extensible) so the OHLC
          block renders identically; the margin rows append below it. */}
      {ohlcRows.map((row) => (
        <Flex key={row.label} row justifyContent="space-between" gap="$spacing8">
          <Text variant="body3" color="$neutral1">
            {row.label}
          </Text>
          <Flex>
            <Text variant="body3" color="$neutral1">
              {row.value}
            </Text>
          </Flex>
        </Flex>
      ))}
      {pnlRow !== undefined ? (
        <Flex maxWidth={APPENDED_ROW_MAX_WIDTH} mt="$spacing4">
          <Text variant="body4" color="$neutral2">
            {pnlRow}
          </Text>
        </Flex>
      ) : null}
      {explainer !== undefined ? (
        <Flex maxWidth={APPENDED_ROW_MAX_WIDTH} mt="$spacing4">
          <Text variant="body4" color="$neutral2">
            {explainer}
          </Text>
        </Flex>
      ) : null}
    </Text>
  )
}
