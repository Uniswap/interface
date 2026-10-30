import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { type MarginMarket } from '~/constants/margin'
import { MarginAdjustBeforeAfterSection } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginAdjustLeverageSection } from '~/pages/Swap/Margin/components/MarginAdjustLeverageSection'
import { MarginAdjustQuoteRows } from '~/pages/Swap/Margin/components/MarginAdjustQuoteRows'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { useDraggedLeverage } from '~/pages/Swap/Margin/hooks/useDraggedLeverage'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import { clampManageLeverage } from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import { marginAssetCurrencyId, marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { marginPositionTokens } from '~/pages/Swap/Margin/marginPositionRow'
import { marginRowDirection, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

// Change leverage: no amount field, targetLeverageX18 only. Both directions go through the one
// ADJUST intent — the deleted modal needed INCREASE for up and DECREASE (via close_quote, with a
// hand-built maxLtvAfter echo) for down, and neither intent exists any more.
export function MarginChangeLeverageModal({
  position,
  market,
  isOpen,
  onClose,
}: {
  position: MarginActivePosition
  market: MarginMarket
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfos = useMarginCurrencyInfos()
  const { draggedLeverage, leverageDraft, setLeverageDraft, onSliderChange, commitLeverageDraft } = useDraggedLeverage({
    market,
  })
  // Expanded by default: this flow always carries a swap leg, so MarginPriceImpactRow can have
  // something to say — and Confirm broadcasts directly, with no later review of the fill. (Add and
  // Withdraw stay collapsed: a pure deposit/withdrawal produces no effectivePrice, so the row is inert.)
  const [isExpanded, setIsExpanded] = useState(true)

  // The POSITION's mark is polled apart from the quote, and TWO readouts depend on that gap: the impact
  // row captions itself as delayed, and the before/after section withholds its liquidation-distance
  // suffix. Prune this from either consumer and the epoch-mixed figure comes back silently.

  const markIsStale = useMarginPositionMarkIsStale()

  const controller = useMarginAdjustController({
    position,
    market,
    funding: { kind: 'none' },
    // Opens in DRIFT, not explicit/locked. MANAGE_MIN_LEVERAGE clamps the display and a debt-free
    // position reads 1x, so an explicit default would compute |1.1 - 1| = 0.1 >=
    // ADJUST_MIN_LEVERAGE_DELTA, fire a real quote on open, and arm Confirm for a change the user
    // never made.
    mode: draggedLeverage !== undefined ? { kind: 'explicit', value: draggedLeverage } : { kind: 'drift' },
    action: 'leverage',
    onClose,
  })

  // beforeLeverage comes from the quote's before-state. Do NOT fall back to controller.currentLeverage:
  // it returns 1 for BOTH debt-free and at/past-LLTV positions, so it would render 1.00x on a position
  // about to liquidate and anchor the whole screen on a fiction.
  const before = controller.beforeLeverage
  // The UNDRAGGED readout reports the position's real leverage, uncapped: a position that has drifted
  // above the venue ceiling would otherwise open showing the cap while MarginPairHeading on the same
  // screen shows the true figure — two readouts contradicting each other in exactly the over-cap case
  // the controller has an `isOverVenueCap` path for. Only a value the user DRAGGED is clamped, since
  // that one becomes the request.
  const displayedLeverage =
    before === undefined
      ? undefined
      : draggedLeverage === undefined
        ? Math.max(before, MANAGE_MIN_LEVERAGE)
        : clampManageLeverage({ leverage: draggedLeverage, venueCap: controller.venueCap })

  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl
  const debtLogos = { url: debtLogoUrl ?? undefined, symbol: marginUnwrapSymbol(market.debt) }
  // The Size row reads the EXPOSURE leg — a short's is its debt leg, a long's its collateral.
  const sizeLogos =
    position.direction === MarginDirection.SHORT
      ? debtLogos
      : { url: collateralLogoUrl ?? undefined, symbol: market.displaySymbol }

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginChangeLeverage}
      title={t('margin.changeLeverage.title')}
      isOpen={isOpen}
      onClose={onClose}
      ctaLabel={t('margin.changeLeverage.cta')}
      // `displayedLeverage === undefined` is the same unusable state the footer announces: a poll can
      // drop `leverage` mid-sheet, unmounting the slider while a stale dragged target keeps quoting.
      // Without this Confirm sits live next to copy saying the action is unavailable.
      ctaDisabled={controller.confirmDisabled || displayedLeverage === undefined}
      ctaLoading={controller.isQuoteLoading || controller.isEditStale}
      ctaTestID={TestID.MarginChangeLeverageCta}
      footerMessage={
        // A position with no finite leverage (equity at or below zero) renders no slider and can never
        // arm Confirm — without this the body is empty under the heading and the disabled CTA says
        // nothing. Leverage is not the action that helps here, so the copy points at the ones that do.
        displayedLeverage === undefined ? (
          <Text variant="body4" color="$statusWarning" textAlign="center">
            {t('margin.leverage.unavailable')}
          </Text>
        ) : (
          // Neither is reachable with funding: { kind: 'none' }, and there is no payment token to name.
          <MarginActionFooterMessage
            isPlanInFlight={controller.isPlanInFlight}
            insufficientBalance={false}
            overMax={false}
          />
        )
      }
      onConfirm={controller.onConfirm}
    >
      <MarginPairHeading market={market} variant="direction" position={position} />
      <MarginExcludedVenueNotice venue={market.venue} />
      {displayedLeverage !== undefined ? (
        <MarginAdjustLeverageSection
          displayedLeverage={displayedLeverage}
          leverageDraft={leverageDraft}
          cap={controller.cap}
          lltvWad={market.lltvWad}
          direction={position.direction}
          onLeverageDraftChange={setLeverageDraft}
          onCommitLeverageDraft={commitLeverageDraft}
          onSliderChange={onSliderChange}
        />
      ) : null}
      {controller.quoteErrorResult ? (
        <Text variant="body3" color="$statusCritical">
          {controller.quoteErrorResult.message}
        </Text>
      ) : null}
      <MarginAdjustBeforeAfterSection
        markIsStale={markIsStale}
        hasLeverageControl
        displayQuote={controller.displayQuote}
        position={position}
        showInitialSkeleton={controller.showInitialSkeleton}
        dim={controller.dimBeforeAfter}
        sizeLogos={sizeLogos}
      />
      <MarginAdjustShowMoreSection
        isExpanded={isExpanded}
        dim={controller.dimBeforeAfter}
        onToggle={toggleExpanded}
        slippageToleranceBps={controller.slippageToleranceBps}
        gasDisplay={controller.gasDisplay}
        extraRows={
          controller.displayQuote ? (
            <MarginAdjustQuoteRows
              markIsStale={markIsStale}
              quote={controller.displayQuote}
              position={position}
              direction={marginRowDirection({ direction: position.direction, ...marginPositionTokens(position) })}
              debtDecimals={market.debt.decimals}
              debtDisplaySymbol={marginUnwrapSymbol(market.debt)}
              logos={debtLogos}
            />
          ) : undefined
        }
      />
    </MarginActionModalShell>
  )
}
