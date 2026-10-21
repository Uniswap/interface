import { Flex, Text, TouchableArea } from '@universe/mycelium'
import type { ColorTokens } from '@universe/mycelium'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeightAnimator, Popover, Separator } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Sliders } from 'ui/src/components/icons/Sliders'
import { X } from 'ui/src/components/icons/X'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { MarginHealthPill } from '~/pages/Swap/Margin/components/shared/MarginHealthPill'
import { MarginLeverageSlider } from '~/pages/Swap/Margin/components/shared/MarginLeverageSlider'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'
import { floorTo2 } from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { marginAssetCurrencyId, marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import {
  exposureUsdValue,
  formatLiqDistanceSuffix,
  getMarginHealthStatus,
  marginPriceUnitSymbol,
  projectedDebtAmount,
  quoteLiqDistanceSignedPct,
  scaledE18ToNumber,
  usableWireAmount,
} from '~/pages/Swap/Margin/marginFormat'
import { MIN_LEVERAGE, shouldClampLeverageToCap } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { displayMarkPriceX18, resolveRoutedMarkPriceX18 } from '~/pages/Swap/Margin/marginRoutedMarket'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

const LEVERAGE_POPOVER_WIDTH = 360

// Size output + leverage chip (anchored popover with editable numeric + tick slider) + Liquidates-at row.
export function MarginSizeBlock({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element | null {
  // The freshness bound compares against Date.now(), which only advances a render — and the poll
  // going quiet is exactly when a mark ages out. Keeps the disclosure honest while this is on screen.
  useMarginMarketsStaleTick()

  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const leverage = useMarginFormStore((s) => s.leverage)
  const { setMarginFormState } = useMarginFormStoreActions()
  const currencyInfos = useMarginCurrencyInfos()

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  // Draft for the editable numeric; committed through the clamp on blur/Enter.
  const [leverageDraft, setLeverageDraft] = useState<string | undefined>(undefined)

  const { quote, market, maxLeverage, direction } = derivedMarginInfo
  const { getLive, getMarketByTokens, dataUpdatedAt } = useMarginMarkets()
  // Client max over the ALLOWED venues' server-authored caps. Floored at MIN_LEVERAGE so an
  // unknown ceiling (a market carrying none) can never clamp leverage under the backend's own floor
  // and 400 every quote.
  const cap = Math.max(maxLeverage ?? MIN_LEVERAGE, MIN_LEVERAGE)

  // Escape unmounts the focused input without firing blur, so a half-typed draft would survive the
  // close: reopening shows the stale value while the chip and slider show the committed leverage, and
  // the next blur commits the abandoned edit.
  const onPopoverOpenChange = useEvent((open: boolean) => {
    if (!open) {
      setLeverageDraft(undefined)
    }
    setIsPopoverOpen(open)
  })

  const setLeverage = useEvent((next: number) => {
    const clamped = Math.min(Math.max(next, MIN_LEVERAGE), cap)
    // Floor to 2 decimals so a fractional cap (e.g. LLTV 0.86 → ~5.5555) never rounds UP past the
    // backend leverage cap, which would 400 the quote. The headline "Max" stays rounded (cosmetic).
    // Floored on the decimal STRING, not via `Math.floor(x * 100) / 100`: `2.3 * 100` is
    // 229.99999999999997, so the float form silently stores 2.29 for a committed "2.3".
    setMarginFormState({ leverage: Number(floorTo2(clamped)) })
  })

  useEffect(() => {
    if (shouldClampLeverageToCap({ maxLeverage, leverage, cap })) {
      setLeverage(cap)
    }
  }, [cap, leverage, maxLeverage, setLeverage])

  // Slider drives the value → drop any half-typed numeric draft so the two stay in sync, then clamp.
  const onLeverageSliderChange = useEvent((next: number) => {
    setLeverageDraft(undefined)
    setLeverage(next)
  })

  const closePopover = useEvent(() => setIsPopoverOpen(false))

  const commitLeverageDraft = useEvent(() => {
    if (leverageDraft === undefined) {
      return
    }
    const parsed = Number(leverageDraft)
    if (Number.isFinite(parsed) && parsed > 0) {
      setLeverage(parsed)
    }
    setLeverageDraft(undefined)
  })

  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  // On open, Tamagui's Popover FocusScope auto-focuses the first tabbable child (the leverage
  // input) and select-all's it — showing the value highlighted. Prevent it; an intentional tap
  // still focuses (and selectTextOnFocus then selects for easy overtype).
  const preventPopoverAutoFocus = useEvent((e: Event) => e.preventDefault())

  if (!quote) {
    return null
  }

  const health = quote.display.healthFactor
    ? getMarginHealthStatus(scaledE18ToNumber(quote.display.healthFactor))
    : undefined
  const valueColor = health?.color ?? '$neutral1'

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl

  // display.size is denominated in the exposure leg — a short's is its debt leg, a long's its collateral.
  const isShort = direction === 'SHORT'
  const exposureSymbol = isShort ? marginUnwrapSymbol(market.debt) : market.displaySymbol
  const exposureLogoUrl = isShort ? debtLogoUrl : collateralLogoUrl
  const notional =
    quote.display.size !== undefined
      ? // Decoded off the QUOTE's own declared exposure decimals, not the form market's: a quote whose
        // pair drifted from the form's would otherwise render at the wrong scale.
        usableWireAmount({ raw: quote.display.size, decimals: quote.exposureToken.decimals })
      : undefined
  // The routed venue's ORACLE mark where the registry has one, so the size figure is valued on the same
  // basis as the liquidation distance below. Falls back to the quote's own fill price, which is the
  // nearest honest stand-in when no mark is available — the impact row has no such fallback, so it takes
  // the UNBOUNDED mark and discloses the delay instead.
  //
  // That disclosure is NOT visible here: on the form the impact row sits inside a HeightAnimator that is
  // collapsed by default (MarginRateRows), so this basis flip happens with nothing on screen saying the
  // poll aged. It IS visible in the review modal, which renders the row unconditionally — which is the
  // surface where the flip matters, since that is where the trade is confirmed.
  const routedMarkPriceX18 = resolveRoutedMarkPriceX18({
    market,
    quote,
    getMarketByTokens,
    getLive,
    marketsUpdatedAt: dataUpdatedAt,
  }).priceX18
  const usableMark = displayMarkPriceX18({ markPriceX18: routedMarkPriceX18, quote })
  const markPrice = usableMark ? scaledE18ToNumber(usableMark) : undefined
  const notionalUsd =
    notional !== undefined && markPrice !== undefined
      ? exposureUsdValue({ exposureAmount: notional, mark: markPrice })
      : undefined

  const liqPriceDisplay = quote.display.liquidationPrice
    ? formatNumberOrString({
        value: scaledE18ToNumber(quote.display.liquidationPrice),
        type: NumberType.FiatTokenPrice,
      })
    : undefined
  // The volatile asset's USD price — for a SHORT that's the debt token, not the (stable) collateral
  // displaySymbol.
  const liqUnitSymbol = marginPriceUnitSymbol({ collateral: market.collateral, debt: market.debt, direction })

  // The ROUTED venue's ORACLE mark, not the quote's fill price: liquidation triggers off the oracle,
  // and an open's fill is adverse to it — anchoring on the fill would overstate the buffer by roughly
  // the impact. Also what the positions table measures against, so the figure does not jump the moment
  // the position opens.
  const liqDistancePct = quoteLiqDistanceSignedPct({
    liquidationPriceX18: quote.display.liquidationPrice,
    markPriceX18: routedMarkPriceX18,
  })

  // Recovered from the projection (the quote publishes no debt figure), in debt-token units.
  const borrowing = projectedDebtAmount({ quote })

  // The PRICE comes off the quote and needs no mark; only the distance suffix does. Gating the whole
  // row on the distance hid where the position liquidates whenever the venue published no usable mark.
  // One renderer for both surfaces: the row and the leverage popover print the same
  // `1 {sym} = {price}` + conditional distance suffix, and differ only in the outer colour.
  const liquidatesAtText = (color: ColorTokens): JSX.Element | null =>
    liqPriceDisplay ? (
      <Text variant="body3" color={color}>
        1 {liqUnitSymbol} = {liqPriceDisplay}{' '}
        {liqDistancePct === undefined ? null : (
          <Text variant="body3" color={valueColor}>
            {formatLiqDistanceSuffix(liqDistancePct)}
          </Text>
        )}
      </Text>
    ) : null
  const liquidatesAtValue = liquidatesAtText('$neutral1')

  return (
    <Flex gap="$spacing12" p="$spacing16" borderRadius="$rounded20" backgroundColor="$surface2">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="body3" color="$neutral2">
          {t('margin.size.label')}
        </Text>
        <Popover placement="bottom-end" stayInFrame allowFlip open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
          <Popover.Trigger cursor="pointer">
            <Flex
              row
              alignItems="center"
              gap="$spacing4"
              px="$spacing8"
              py="$spacing4"
              borderRadius="$roundedFull"
              borderWidth={1}
              borderColor="$surface3"
              backgroundColor="$surface1"
              hoverStyle={{ backgroundColor: '$surface3' }}
            >
              <Sliders size="$icon.16" color="$neutral2" />
              <Text variant="buttonLabel3" color={valueColor}>
                {leverage.toFixed(2)}x
              </Text>
              {quote.display.healthFactor ? (
                <MarginHealthPill healthFactor={scaledE18ToNumber(quote.display.healthFactor)} />
              ) : null}
              <RotatableChevron direction={isPopoverOpen ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
            </Flex>
          </Popover.Trigger>
          {/* Dark blurred panel — always dark via $scrim, so text is fixed white.
              Fade in with opacity only (no scale) so the slider isn't measured mid-transform. */}
          <Popover.Content
            backgroundColor="$scrim"
            borderRadius="$rounded16"
            p="$spacing16"
            width={LEVERAGE_POPOVER_WIDTH}
            elevate
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            onOpenAutoFocus={preventPopoverAutoFocus}
            $platform-web={{ backdropFilter: 'blur(12px)' }}
          >
            <Flex gap="$spacing12" width="100%">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="body3" color="$white" opacity={0.8}>
                  {t('margin.leverage.sliderLabel')}
                </Text>
                <TouchableArea onPress={closePopover} aria-label={t('common.button.close')}>
                  <X size="$icon.20" color="$white" />
                </TouchableArea>
              </Flex>
              {/* Big editable leverage (left) + resulting size/USD (right). USD is the LOCAL computation
                  (notionalUsd) — notionalUsd is NOT a quote wire field. */}
              <Flex row justifyContent="space-between" alignItems="flex-start" gap="$spacing12">
                <Flex row alignItems="center" gap="$spacing4">
                  <AmountInput
                    value={leverageDraft ?? leverage.toFixed(2)}
                    adjustWidthToContent
                    maxDecimals={2}
                    selectTextOnFocus
                    aria-label={t('margin.leverage.sliderLabel')}
                    backgroundColor="$transparent"
                    borderWidth="$none"
                    color="$white"
                    px="$none"
                    py="$none"
                    fontFamily="$heading"
                    fontSize={fonts.heading2.fontSize}
                    fontWeight={fonts.heading2.fontWeight}
                    lineHeight={fonts.heading2.lineHeight}
                    overflow="visible"
                    onChangeText={setLeverageDraft}
                    onBlur={commitLeverageDraft}
                    onSubmitEditing={commitLeverageDraft}
                  />
                  <Text
                    color="$white"
                    opacity={0.5}
                    fontFamily="$heading"
                    fontSize={fonts.heading2.fontSize}
                    fontWeight={fonts.heading2.fontWeight}
                  >
                    x
                  </Text>
                </Flex>
                {notional !== undefined ? (
                  <Flex alignItems="flex-end" gap="$spacing2">
                    <Text variant="subheading2" color="$white">
                      {formatNumberOrString({ value: notional, type: NumberType.TokenTx })} {exposureSymbol}
                    </Text>
                    {notionalUsd !== undefined ? (
                      <Text variant="body3" color="$white" opacity={0.6}>
                        {formatNumberOrString({ value: notionalUsd, type: NumberType.FiatStandard })}
                      </Text>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>
              <MarginLeverageSlider
                value={Math.min(leverage, cap)}
                cap={cap}
                onChange={onLeverageSliderChange}
                trackColor="$statusSuccess"
                inactiveTrackColor="$neutral3"
                thumbColor="$white"
                tickColor="$white"
              />
              {/* Same split as the main row: the price needs no mark, only the suffix does. */}
              {liqPriceDisplay ? (
                <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
                  <Text variant="body3" color="$white" opacity={0.8}>
                    {t('margin.size.liquidatesAt')}
                  </Text>
                  {liquidatesAtText('$white')}
                </Flex>
              ) : null}
            </Flex>
          </Popover.Content>
        </Popover>
      </Flex>

      {notional !== undefined ? (
        <Flex gap="$spacing2">
          <Flex row alignItems="center" gap="$spacing8">
            <TokenLogo size={28} url={exposureLogoUrl} symbol={exposureSymbol} chainId={MARGIN_CHAIN_ID} />
            <Text variant="heading2" color="$neutral1">
              {formatNumberOrString({ value: notional, type: NumberType.TokenTx })} {exposureSymbol}
            </Text>
          </Flex>
          {notionalUsd !== undefined ? (
            <Text variant="body4" color="$neutral2">
              {formatNumberOrString({ value: notionalUsd, type: NumberType.FiatStandard })}
            </Text>
          ) : null}
        </Flex>
      ) : null}

      {liquidatesAtValue ? (
        <Flex gap="$spacing8">
          <Separator />
          <TouchableArea onPress={toggleExpanded}>
            <Flex row justifyContent="space-between" alignItems="center">
              <Text variant="body3" color="$neutral2">
                {t('margin.size.liquidatesAt')}
              </Text>
              <Flex row alignItems="center" gap="$spacing4">
                {liquidatesAtValue}
                <RotatableChevron direction={isExpanded ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
              </Flex>
            </Flex>
          </TouchableArea>
          <HeightAnimator open={isExpanded}>
            <Flex row justifyContent="space-between" alignItems="center" pb="$spacing2">
              <Text variant="body3" color="$neutral2">
                {t('margin.size.borrowing')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {borrowing === undefined
                  ? '—'
                  : `${formatNumberOrString({ value: borrowing, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(market.debt)}`}
              </Text>
            </Flex>
          </HeightAnimator>
        </Flex>
      ) : null}
    </Flex>
  )
}
