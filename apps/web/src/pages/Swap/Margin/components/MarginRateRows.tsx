import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeightAnimator, Input, Popover, Tooltip } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Settings } from 'ui/src/components/icons/Settings'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { MarginRoutedVenueRow } from '~/pages/Swap/Margin/components/MarginRoutedVenueRow'
import { MarginRouteRow } from '~/pages/Swap/Margin/components/MarginRouteRow'
import {
  MarginVenuePreferencesModal,
  MarginVenueSettingsRow,
  useActiveMarginPairGroup,
} from '~/pages/Swap/Margin/components/MarginVenuePreferences'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { findMarginTokenInfoInMarkets, useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'
import {
  marginPriceUnitSymbol,
  scaledE18ToNumber,
  usablePriceX18,
  usableWireAmount,
} from '~/pages/Swap/Margin/marginFormat'
import { marginPriceImpactBps } from '~/pages/Swap/Margin/marginPriceImpact'
import { resolveRoutedMarkPriceX18 } from '~/pages/Swap/Margin/marginRoutedMarket'
import { buildMarginRouteSteps } from '~/pages/Swap/Margin/marginRouteSteps'
import { marginPairLegs, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

const MAX_SLIPPAGE_BPS = 1000

function FeeRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Text variant="body3" color="$neutral1" textAlign="right" flexShrink={1}>
        {value}
      </Text>
    </Flex>
  )
}

function SlippagePresetChip({
  label,
  active,
  bps,
  onSelect,
}: {
  label: string
  active: boolean
  bps: number
  onSelect: (bps: number) => void
}): JSX.Element {
  const onPress = useEvent(() => onSelect(bps))
  return (
    <TouchableArea
      px="$spacing8"
      py="$spacing4"
      borderRadius="$roundedFull"
      backgroundColor={active ? '$accent2' : '$surface3'}
      onPress={onPress}
    >
      <Text variant="buttonLabel4" color={active ? '$accent1' : '$neutral2'}>
        {label}
      </Text>
    </TouchableArea>
  )
}

// Margin-scoped Max-slippage control, shared by the expanded fee row and the tab-row ⚙︎ popover.
export function MarginSlippageControl(): JSX.Element {
  const { t } = useTranslation()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [draft, setDraft] = useState<string | undefined>(undefined)

  const setSlippage = useEvent((bps: number) => {
    setMarginFormState({ slippageToleranceBps: bps })
  })

  const commitDraft = useEvent(() => {
    if (draft === undefined) {
      return
    }
    const parsed = Number(draft)
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE_BPS) {
      setSlippage(parsed)
    }
    setDraft(undefined)
  })

  return (
    <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
      <SlippagePresetChip
        label={`${t('common.auto')} (0.50%)`}
        active={slippageToleranceBps === 50}
        bps={50}
        onSelect={setSlippage}
      />
      <SlippagePresetChip label="0.1%" active={slippageToleranceBps === 10} bps={10} onSelect={setSlippage} />
      <SlippagePresetChip label="1.0%" active={slippageToleranceBps === 100} bps={100} onSelect={setSlippage} />
      <Flex row alignItems="center" gap="$spacing4">
        <Input
          value={draft ?? String(slippageToleranceBps)}
          keyboardType="number-pad"
          width={56}
          height={32}
          px="$spacing8"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded8"
          backgroundColor="$transparent"
          color="$neutral1"
          fontSize={13}
          textAlign="right"
          aria-label={t('margin.fees.maxSlippage')}
          onChangeText={setDraft}
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
        />
        <Text variant="body4" color="$neutral2">
          bps
        </Text>
      </Flex>
    </Flex>
  )
}

// Tab-row ⚙︎ for the Margin tab: a small margin-scoped popover (NOT the swap-wide settings UI). Also
// the venue opt-out sheet's second entry point — the first is the market picker's per-pair cell.
export function MarginSettingsPopover(): JSX.Element {
  const { t } = useTranslation()
  const group = useActiveMarginPairGroup()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isVenuesOpen, setIsVenuesOpen] = useState(false)

  // Closes the panel on the way out: the popover would otherwise sit behind the modal it launched.
  const openVenues = useEvent(() => {
    setIsPopoverOpen(false)
    setIsVenuesOpen(true)
  })
  const closeVenues = useEvent(() => setIsVenuesOpen(false))

  return (
    <>
      <Popover placement="bottom-end" stayInFrame allowFlip open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Trigger cursor="pointer">
          <Flex p="$spacing4" borderRadius="$roundedFull" hoverStyle={{ backgroundColor: '$surface2' }}>
            <Settings size="$icon.20" color="$neutral2" />
          </Flex>
        </Popover.Trigger>
        <Popover.Content
          backgroundColor="$surface1"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded16"
          p="$spacing12"
          elevate
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
        >
          <Flex gap="$spacing12" minWidth={280}>
            {group ? <MarginVenueSettingsRow group={group} onPress={openVenues} /> : null}
            <Flex gap="$spacing8">
              <Text variant="body3" color="$neutral2">
                {t('margin.fees.maxSlippage')}
              </Text>
              <MarginSlippageControl />
            </Flex>
          </Flex>
        </Popover.Content>
      </Popover>
      {/* Outside the popover, whose content unmounts on the very close that opens this. */}
      {isVenuesOpen && group ? <MarginVenuePreferencesModal group={group} isOpen onClose={closeVenues} /> : null}
    </>
  )
}

// The routed venue leads the rate area — it is the one fact here that exists before a quote does —
// over the collapsed rate/gas row, which only appears once there is something to price.
export function MarginRateRows({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element {
  const { quote, isPlaceholderData } = derivedMarginInfo
  // A bridged quote's venue is provisional (selection is amount- and leverage-aware), so the chip
  // falls back to "Auto" for that window rather than naming a venue the server may not have picked.
  const routedVenue = isPlaceholderData ? undefined : quote?.legs[0]?.venue

  return (
    <Flex px="$spacing4">
      <MarginRoutedVenueRow routedVenue={routedVenue} />
      {quote ? <MarginRateDetails derivedMarginInfo={derivedMarginInfo} quote={quote} /> : null}
    </Flex>
  )
}

// Collapsed rate/gas row expandable to the itemized fee list + Route summary + Max-slippage control.
function MarginRateDetails({
  derivedMarginInfo,
  quote,
}: {
  derivedMarginInfo: DerivedMarginInfo
  quote: MarginQuoteResponse
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { markets, getLive, getMarketByTokens, dataUpdatedAt } = useMarginMarkets()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSlippageOpen, setIsSlippageOpen] = useState(false)

  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))
  const toggleSlippage = useEvent(() => setIsSlippageOpen((prev) => !prev))

  const { market, direction } = derivedMarginInfo

  const priceUnitSymbol = marginPriceUnitSymbol({ collateral: market.collateral, debt: market.debt, direction })
  const priceQuoteSymbol = marginUnwrapSymbol(marginPairLegs(market).quote)

  // Same `'0'`-is-a-truthy-string guard the size valuation and liquidation distance use — otherwise
  // this row renders an entry price of $0.00 instead of hiding.
  const usableEntry = usablePriceX18(quote.display.effectivePrice)
  const entryPrice = usableEntry ? scaledE18ToNumber(usableEntry) : undefined
  const entryPriceDisplay =
    entryPrice !== undefined
      ? `${formatNumberOrString({ value: entryPrice, type: NumberType.TokenTx })} ${priceQuoteSymbol}`
      : undefined
  // The entry price is quoted in the stable (quote) leg, so it doubles as a fiat figure.
  const entryPriceFiat =
    entryPrice !== undefined ? formatNumberOrString({ value: entryPrice, type: NumberType.FiatTokenPrice }) : undefined

  // The leverage swap's fill against the venue's oracle mark. An open always buys collateral, for
  // LONG and SHORT alike. Hidden below the swap surface's warning threshold.
  //
  // Priced against the ROUTED venue's mark, never the form's pair-first market — see
  // resolveRoutedMarkPriceX18. Undefined on a registry miss, which hides the row rather than
  // comparing this fill against another venue's mark.
  // allowStale, deliberately: impact IS mark-vs-fill and cannot fall back to the fill, so withholding
  // an aged mark hides the row entirely — see the argument's docstring. The resolver returns the
  // freshness alongside the price so the row can SAY it is delayed rather than quietly using it.
  // The freshness bound compares against Date.now(), which only advances a render — and the poll
  // going quiet is exactly when a mark ages out. Keeps the disclosure honest while this is on screen.
  useMarginMarketsStaleTick()

  const impactMark = resolveRoutedMarkPriceX18({
    market,
    quote,
    getMarketByTokens,
    getLive,
    marketsUpdatedAt: dataUpdatedAt,
    allowStale: true,
  })
  const priceImpactBps = marginPriceImpactBps({
    execPriceX18: quote.display.effectivePrice,
    markPriceX18: impactMark.priceX18,
    swapSide: 'BUY_COLLATERAL',
    direction: direction ?? 'LONG',
  })

  const markIsStale = impactMark.isStale

  // Through usablePriceX18, not a bare `!== undefined`: the wire sends '0' where it means "could not
  // price", and rendering that as $0.00 would suppress the real ETH figure one branch down.
  const gasFeeUsd = usablePriceX18(quote.gasEstimate?.gasFeeUsd)
  const gasUsd = gasFeeUsd !== undefined ? scaledE18ToNumber(gasFeeUsd) : undefined
  // Through the same guarded decode as the size figures: a bare BigInt() here throws a SyntaxError on
  // a non-integer wire value and unwinds to the app ErrorBoundary, where '—' was the intended fallback.
  const gasFeeEth =
    quote.gasEstimate === undefined ? undefined : usableWireAmount({ raw: quote.gasEstimate.gasFeeWei, decimals: 18 })
  const gasDisplay =
    gasUsd !== undefined
      ? formatNumberOrString({ value: gasUsd, type: NumberType.FiatGasPrice })
      : gasFeeEth !== undefined
        ? `${gasFeeEth.toFixed(5)} ETH`
        : '—'

  // Slippage applies per leg; with a pre-swap the effective total compounds: (1+s)² − 1 ≈ 2s.
  const slippageFraction = slippageToleranceBps / 10_000
  const slippagePercentDisplay = quote.paymentSwap
    ? `${(((1 + slippageFraction) ** 2 - 1) * 100).toFixed(2)}%`
    : `${(slippageFraction * 100).toFixed(2)}%`

  const routeSteps = buildMarginRouteSteps({
    quote,
    market,
    paymentTokenSymbol: derivedMarginInfo.paymentToken.symbol,
    resolveSymbol: (address) => {
      const token = findMarginTokenInfoInMarkets({ markets, address })
      return token ? marginUnwrapSymbol(token) : undefined
    },
  })

  const slippageValue = (
    <TouchableArea onPress={toggleSlippage}>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="body3" color="$neutral1">
          {slippagePercentDisplay}
        </Text>
        <RotatableChevron direction={isSlippageOpen ? 'up' : 'down'} size="$icon.16" color="$neutral3" />
      </Flex>
    </TouchableArea>
  )

  return (
    <>
      <TouchableArea onPress={toggleExpanded}>
        <Flex row justifyContent="space-between" alignItems="center" py="$spacing4">
          {entryPriceDisplay ? (
            <Text variant="body3" color="$neutral1">
              1 {priceUnitSymbol} = {entryPriceDisplay}{' '}
              <Text variant="body3" color="$neutral2">
                ({entryPriceFiat})
              </Text>
            </Text>
          ) : (
            <Text variant="body3" color="$neutral2">
              {t('margin.fees.networkCost')}
            </Text>
          )}
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="body3" color="$neutral2">
              {gasDisplay}
            </Text>
            <RotatableChevron direction={isExpanded ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
          </Flex>
        </Flex>
      </TouchableArea>
      <HeightAnimator open={isExpanded}>
        <Flex gap="$spacing8" pt="$spacing8" pb="$spacing2">
          {entryPriceDisplay ? <FeeRow label={t('margin.fees.entryPrice')} value={entryPriceDisplay} /> : null}
          <MarginPriceImpactRow impactBps={priceImpactBps} markIsStale={markIsStale} />
          {quote.display.borrowRate ? (
            <FeeRow
              label={t('margin.fees.borrowRate')}
              value={`${(scaledE18ToNumber(quote.display.borrowRate) * 100).toFixed(2)}% APY`}
            />
          ) : null}
          <FeeRow label={t('margin.fees.networkCost')} value={gasDisplay} />
          {/* Single no-gap child: a collapsed HeightAnimator sibling would double the column gap
              between the slippage and Route rows (gap applies around zero-height children too). */}
          <Flex>
            <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
              <Text variant="body3" color="$neutral2">
                {t('margin.fees.maxSlippage')}
              </Text>
              {quote.paymentSwap ? (
                <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
                  <Tooltip.Content>
                    <Tooltip.Arrow />
                    <Text variant="body4">{t('margin.fees.slippageCompoundedTooltip')}</Text>
                  </Tooltip.Content>
                  <Tooltip.Trigger>{slippageValue}</Tooltip.Trigger>
                </Tooltip>
              ) : (
                slippageValue
              )}
            </Flex>
            <HeightAnimator open={isSlippageOpen}>
              <Flex pt="$spacing8" pb="$spacing4">
                <MarginSlippageControl />
              </Flex>
            </HeightAnimator>
          </Flex>
          <MarginRouteRow steps={routeSteps} />
        </Flex>
      </HeightAnimator>
    </>
  )
}
