import { Flex } from '@universe/mycelium'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  type PriceStrategy,
  PriceStrategyCard,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/DefaultPriceStrategies'
import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { RangeAmountInputPriceMode, type TickRange } from '~/features/Liquidity/Create/types'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { toDisplayTick, toDisplayTickRange } from '~/features/Liquidity/utils/displayTicks'
import { priceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import { tryParseRangeTick } from '~/features/Liquidity/utils/tryParseRangeTick'
import { usePdpChartRangePreviewValue } from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'
import { usePriceRangeLabel } from '~/pages/PoolDetails/components/LiquidityPanel/PdpPriceRangeSummary'
import { PdpRangeEdgeInput } from '~/pages/PoolDetails/components/LiquidityPanel/PdpRangeEdgeInput'
import {
  detectPdpRangePreset,
  getOneSidedRange,
  type PdpRangePreset,
} from '~/pages/PoolDetails/components/LiquidityPanel/pdpRangePresets'
import {
  getMovePercentDecimals,
  getPriceRangeSummary,
  getRangeEdgeMoves,
  roundMovePercent,
  withMoveSign,
} from '~/pages/PoolDetails/components/LiquidityPanel/priceRangeSummary'
import {
  formatEditablePercent,
  formatEditablePrice,
  getEditorDomain,
  percentToDisplayTick,
  setRangeEdge,
  stepRangeEdgeByPercent,
} from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'
import { useDefaultPriceRange } from '~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange'
import { formatPriceWithSubscript } from '~/utils/formatPriceWithSubscript'

/** The pool state the editor works in: display ticks, which are negated when the price is inverted. */
function useEditorPool(): { currentTick: number; tickSpacing: number; priceInverted: boolean } | undefined {
  const { poolOrPair, priceRangeState } = useCreateLiquidityContext()
  if (!poolOrPair || !('tickCurrent' in poolOrPair)) {
    return undefined
  }
  const { priceInverted } = priceRangeState
  return {
    currentTick: toDisplayTick(poolOrPair.tickCurrent, priceInverted),
    tickSpacing: poolOrPair.tickSpacing,
    priceInverted,
  }
}

/** Parses a typed price into a display tick with the create flow's parsers, which snap it to the spacing. */
function useParsePriceTick(tickSpacing: number): (value: string) => number | undefined {
  const { currencies, protocolVersion, positionState, priceRangeState } = useCreateLiquidityContext()
  // The sdk currencies in display orientation: their price's tick is the display tick, negated when inverted.
  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.sdk, priceRangeState.priceInverted)
  return (value: string) =>
    tryParseRangeTick({
      protocolVersion,
      baseToken: baseCurrency,
      quoteToken: quoteCurrency,
      value,
      tickSpacing,
      feeAmount: positionState.fee?.feeAmount,
    })
}

/**
 * How the Min/Max row sits in its container. `panel`: its boxes run to the container's edge and their text sits
 * inset by their padding and outline edge, lined up with the deposit panel's section labels. `flush`: the row runs
 * out past the container's edge by that inset, so its text lines up with the container's padding, as the tiles'
 * boxes do.
 */
export type PdpRangeEditorInset = 'panel' | 'flush'

// The edge inputs' horizontal padding plus their 1px outline edge (PdpRangeEdgeInput).
const EDGE_INPUT_TEXT_INSET = 9

// The glyphs an open edge reads as: a true minus, not a hyphen or dash, and the infinity sign.
const NEGATIVE_INFINITY = '−∞'
const POSITIVE_INFINITY = '+∞'

function PdpRangeEditorBody({
  currentTick,
  tickSpacing,
  inset,
}: {
  currentTick: number
  tickSpacing: number
  inset: PdpRangeEditorInset
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const { currencies, priceRangeState, setPriceRangeState, ticks } = useCreateLiquidityContext()
  const { priceInverted, fullRange } = priceRangeState
  // The flow's live ticks, not the stored ones: a followed preset's range moves with the pool's price, and
  // the stored ticks are where it was when picked.
  const [tickLower, tickUpper] = ticks
  const range =
    typeof tickLower === 'number' && typeof tickUpper === 'number'
      ? toDisplayTickRange({ tickLower, tickUpper }, priceInverted)
      : undefined

  // Set while the price chart's edge lines or the range chart's handles are dragged, so the boxes follow live.
  const preview = usePdpChartRangePreviewValue()
  const parsePriceTick = useParsePriceTick(tickSpacing)
  const [inputMode, setInputMode] = useState(RangeAmountInputPriceMode.PERCENTAGE)
  const toggleInputMode = () =>
    setInputMode((mode) =>
      mode === RangeAmountInputPriceMode.PERCENTAGE
        ? RangeAmountInputPriceMode.PRICE
        : RangeAmountInputPriceMode.PERCENTAGE,
    )

  // The Figma's presets: the pool's suggested (default) range, full range, and one-sided either way.
  const suggestedRange = useDefaultPriceRange()
  const selectedPreset = detectPdpRangePreset({ range, fullRange, suggestedRange, currentTick, tickSpacing })
  const suggestedLabel = usePriceRangeLabel(
    suggestedRange &&
      getPriceRangeSummary({
        fullRange: false,
        tickLower: suggestedRange.minTick,
        tickUpper: suggestedRange.maxTick,
        tickCurrent: currentTick,
        tickSpacing,
        priceInverted: false,
      }),
  )
  const selectPreset = (preset: PdpRangePreset) => {
    if (preset === 'full') {
      setPriceRangeState((prev) => ({ ...prev, fullRange: true, followedPreset: undefined }))
      return
    }
    const presetTicks =
      preset === 'suggested'
        ? suggestedRange
        : getOneSidedRange({ side: preset === 'oneSidedBelow' ? 'below' : 'above', currentTick, tickSpacing })
    if (presetTicks) {
      setCustomRange(presetTicks)
    }
  }

  const setCustomRange = (next: TickRange) => {
    setPriceRangeState((prev) => ({ ...prev, fullRange: false, ...next, followedPreset: undefined }))
  }

  // A full range has no edges of its own to edit from: a typed or stepped edge starts from the view around
  // the price, with the other edge at that view's end.
  const committedRange = fullRange || !range ? getEditorDomain({ range: undefined, currentTick, tickSpacing }) : range
  const shownRange = preview ?? committedRange
  const usable = getUsableTickBounds(tickSpacing)
  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceInverted)
  const tickToPrice = (tick: number) =>
    priceFromTick({
      tick,
      token0Decimals: baseCurrency?.decimals ?? 18,
      token1Decimals: quoteCurrency?.decimals ?? 18,
    })
  // Subscript notation keeps a tiny price (USDC in ETH) legible where the plain formatter floors it to "<0.001".
  const formatTickPrice = (tick: number) =>
    formatPriceWithSubscript({ price: tickToPrice(tick), locale, formatNumberOrString })
  const moves = getRangeEdgeMoves({
    tickLower: shownRange.minTick,
    tickUpper: shownRange.maxTick,
    tickCurrent: currentTick,
    priceInverted: false,
  })

  // A typed edge lands like a drag's release; an unparseable value commits nothing, so the input falls back
  // to the range.
  const commitTypedEdge = (edge: 'min' | 'max') => (typed: string) => {
    let tick: number | undefined
    if (typed === '∞') {
      tick = edge === 'max' ? usable.maxTick : undefined
    } else if (inputMode === RangeAmountInputPriceMode.PERCENTAGE) {
      const percent = parseFloat(typed)
      tick = Number.isNaN(percent) ? undefined : percentToDisplayTick({ percent, currentTick, tickSpacing })
    } else {
      tick = parsePriceTick(typed)
    }
    if (tick === undefined) {
      return
    }
    const next = setRangeEdge({ range: committedRange, edge, tick, tickSpacing })
    if (next.minTick === committedRange.minTick && next.maxTick === committedRange.maxTick && !fullRange) {
      return
    }
    setCustomRange(next)
  }

  // The +/- buttons step an edge's move from the price by half a percent.
  const getEdgeSteps = (edge: 'min' | 'max') => {
    const up = stepRangeEdgeByPercent({ range: committedRange, edge, direction: 1, currentTick, tickSpacing })
    const down = stepRangeEdgeByPercent({ range: committedRange, edge, direction: -1, currentTick, tickSpacing })
    return {
      onIncrement: up && (() => setCustomRange(up)),
      onDecrement: down && (() => setCustomRange(down)),
    }
  }

  const getEdge = (edge: 'min' | 'max') => {
    const tick = edge === 'min' ? shownRange.minTick : shownRange.maxTick
    const move = edge === 'min' ? moves.lower : moves.upper
    const unbounded = edge === 'min' ? tick <= usable.minTick : tick >= usable.maxTick
    if (fullRange) {
      const value = edge === 'min' ? NEGATIVE_INFINITY : POSITIVE_INFINITY
      return { value, caption: value }
    }
    const rounded = roundMovePercent(move * 100)
    const percent = unbounded && edge === 'max' ? '∞' : formatEditablePercent(rounded)
    const percentCaption =
      unbounded && edge === 'max'
        ? POSITIVE_INFINITY
        : withMoveSign(formatPercent(rounded, getMovePercentDecimals(rounded)), rounded)
    const price = unbounded ? (edge === 'min' ? '0' : '∞') : formatEditablePrice(tickToPrice(tick))
    const priceCaption = unbounded ? price : formatTickPrice(tick)
    return inputMode === RangeAmountInputPriceMode.PERCENTAGE
      ? { value: percent, caption: priceCaption }
      : { value: price, caption: percentCaption }
  }
  // A range below the price holds only the quote token, one above it only the base token.
  const presets: PriceStrategy<PdpRangePreset>[] = [
    {
      key: 'suggested',
      title: t('pool.liquidityPanel.preset.suggested'),
      display: suggestedLabel ?? '–',
      description: t('pool.liquidityPanel.preset.suggested.description'),
    },
    {
      key: 'full',
      title: t('pool.liquidityPanel.preset.full'),
      display: '±',
      description: t('pool.liquidityPanel.preset.full.description'),
    },
    {
      key: 'oneSidedBelow',
      title: t('pool.liquidityPanel.preset.sellOnDrop'),
      display: `${NEGATIVE_INFINITY} – 0%`,
      description: t('pool.liquidityPanel.preset.sellOnDrop.description', {
        sell: quoteCurrency?.symbol ?? '',
        buy: baseCurrency?.symbol ?? '',
      }),
    },
    {
      key: 'oneSidedAbove',
      title: t('pool.liquidityPanel.preset.sellOnRise'),
      display: '0% – ∞',
      description: t('pool.liquidityPanel.preset.sellOnRise.description', {
        sell: baseCurrency?.symbol ?? '',
        buy: quoteCurrency?.symbol ?? '',
      }),
    },
  ]

  const minEdge = getEdge('min')
  const maxEdge = getEdge('max')

  return (
    <Flex gap="$gap12">
      <Flex row gap="$gap4" mx={inset === 'flush' ? -EDGE_INPUT_TEXT_INSET : undefined}>
        <PdpRangeEdgeInput
          label={t('pool.minPrice')}
          mode={inputMode}
          disabled={fullRange}
          onCommit={commitTypedEdge('min')}
          onToggleMode={toggleInputMode}
          {...minEdge}
          {...getEdgeSteps('min')}
        />
        <Flex width={1} my="$spacing8" backgroundColor="$surface3" />
        <PdpRangeEdgeInput
          label={t('pool.maxPrice')}
          mode={inputMode}
          disabled={fullRange}
          onCommit={commitTypedEdge('max')}
          onToggleMode={toggleInputMode}
          {...maxEdge}
          {...getEdgeSteps('max')}
        />
      </Flex>
      <Flex $platform-web={{ display: 'grid' }} gridTemplateColumns="repeat(2, 1fr)" gap="$gap4">
        {presets.map((preset) => (
          <PriceStrategyCard
            key={preset.key}
            compact
            strategy={preset}
            selected={preset.key === selectedPreset}
            onSelect={selectPreset}
          />
        ))}
      </Flex>
    </Flex>
  )
}

/**
 * The expanded Price range row: type or step the range's edges, or pick one of the create flow's presets;
 * the range itself is drawn and dragged on the page's price chart. Changes apply as they're made, so the
 * amounts above and the chart follow.
 */
export function PdpRangeEditor({ inset = 'panel' }: { inset?: PdpRangeEditorInset }): JSX.Element | null {
  const pool = useEditorPool()
  if (!pool) {
    return null
  }
  // The input mode and boxes are in display ticks, which flip sign with the price, so a flip starts afresh.
  return (
    <PdpRangeEditorBody
      key={String(pool.priceInverted)}
      currentTick={pool.currentTick}
      tickSpacing={pool.tickSpacing}
      inset={inset}
    />
  )
}
