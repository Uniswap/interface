import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { type MarginMarket } from '~/constants/margin'
import { MarginAdjustBeforeAfterSection } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginAdjustFundingRow } from '~/pages/Swap/Margin/components/MarginAdjustFundingRow'
import { MarginAdjustLeverageSection } from '~/pages/Swap/Margin/components/MarginAdjustLeverageSection'
import { MarginAdjustQuoteRows } from '~/pages/Swap/Margin/components/MarginAdjustQuoteRows'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { MarginPaymentTokenSelector } from '~/pages/Swap/Margin/components/MarginPaymentTokenSelector'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginAmountField } from '~/pages/Swap/Margin/components/shared/MarginAmountField'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { useDraggedLeverage } from '~/pages/Swap/Margin/hooks/useDraggedLeverage'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import { type AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import { getMarginAdjustCtaKind } from '~/pages/Swap/Margin/marginAdjustCtaLabel'
import { deriveAdjustFunding, deriveEquityDeltaRaw } from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { currentEquityRawFromPosition } from '~/pages/Swap/Margin/marginAdjustPositionMath'
import {
  computeAdjustMode,
  floorToSubmittable,
  computeDisplayedLeverage,
  computeFundingDisplay,
  computeMarginHelperRange,
  formatMarginPrefill,
  rawToNumber,
} from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import {
  getMarketDefaultPaymentToken,
  getPaymentCurrency,
  isPaymentTokenDifferentFromCollateral,
  marginAssetCurrencyId,
  marginTokenCurrencyId,
} from '~/pages/Swap/Margin/marginCurrencies'
import { collateralHeld, collateralUsdValue, scaledE18ToNumber } from '~/pages/Swap/Margin/marginFormat'
import { marginPositionDebt } from '~/pages/Swap/Margin/marginPositionRow'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginPositionMark } from '~/pages/Swap/Margin/marginUsdPnl'

// Unified Adjust-position modal: one margin input drives both the funding direction (deposit/withdraw,
// derived as ΔE off the live equity) and, via the Lock-leverage toggle, the target leverage. The
// quote/gate/submit machinery lives in useMarginAdjustController; what stays here is the target-equity
// → funding-delta conversion, which is this modal's alone (the three focused modals type their amount
// in the wire unit directly).

export function MarginAdjustPositionModal({
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
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfos = useMarginCurrencyInfos()

  const collateralDecimals = market.collateral.decimals
  const debtDecimals = market.debt.decimals
  const debt = rawToNumber({ raw: marginPositionDebt(position), decimals: debtDecimals })
  const mark = scaledE18ToNumber(position.oraclePrice)
  // The same price read through the guard, for the balance-sheet solve below. `mark` stays raw for the
  // equity bridge, which tests `mark > 0` itself before dividing by it.
  const usableMark = marginPositionMark({ position })
  const direction = position.direction
  const equityCounterRaw = currentEquityRawFromPosition(position)
  // position.equity is COUNTER-token raw units now (was raw collateral). A SHORT's counter token IS
  // its venue collateral (no conversion); a LONG's counter is the debt/quote leg, so bridge it to
  // collateral units via the oracle mark. Client display math only — the server's own quote binds
  // the real amounts.
  // undefined for a LONG the oracle cannot price: counter-token raw units are NOT collateral raw units,
  // and substituting them mis-scales every figure below by the decimal gap — on WETH/USDC a 0.5 WETH
  // top-up is requested as ~1.5 WETH. The rest of the stack suppresses on an unusable mark rather than
  // scaling through it (marginPnlSuppression's noPrice, resolveRoutedMarkPriceX18); this disables the
  // sheet instead of guessing.
  const currentEquityRaw =
    direction === 'SHORT'
      ? equityCounterRaw
      : mark > 0
        ? BigInt(Math.round((Number(equityCounterRaw) / 10 ** debtDecimals / mark) * 10 ** collateralDecimals))
        : undefined
  const currentEquityHuman =
    currentEquityRaw === undefined
      ? undefined
      : rawToNumber({ raw: currentEquityRaw.toString(), decimals: collateralDecimals })

  // The balance-sheet collateral the displayed-leverage math needs, in collateral units — never a
  // short's `size` (its debt leg, ~1e12 off), which is why this reads the leg through collateralHeld.
  const collateral = collateralHeld({
    direction,
    // A SHORT's `size` IS its debt leg, so it carries that token's decimals.
    exposure: rawToNumber({
      raw: position.size,
      decimals: direction === 'SHORT' ? debtDecimals : collateralDecimals,
    }),
    // Inert on the only branch that can be undefined: collateralHeld reads `equity` for a SHORT only,
    // and a SHORT's counter token IS its collateral, so it never needs the mark that went missing.
    equity: currentEquityHuman ?? 0,
    debt,
    // The GUARDED mark: a SHORT's balance sheet is `equity + debt x mark`, so the raw '0' sentinel
    // collapsed it to equity alone. collateralHeld refuses that rather than measuring against it, and
    // the readout downstream reports no projection instead of one built on a fabricated price.
    mark: usableMark,
  })

  const [marginInput, setMarginInput] = useState(() =>
    currentEquityRaw === undefined ? '' : formatMarginPrefill({ raw: currentEquityRaw, decimals: collateralDecimals }),
  )
  const [marginDirty, setMarginDirty] = useState(false)
  const [selectedPaymentToken, setSelectedPaymentToken] = useState<MarginPaymentToken | undefined>(undefined)
  const [isSelectingPayment, setIsSelectingPayment] = useState(false)
  const [lockLeverage, setLockLeverage] = useState(true)
  // Shared with the Change-leverage sheet: the clamp rule below must hold on both, and it drifted when
  // each spelled its own copy. `onExplicitChange` is this sheet's only addition — setting a target here
  // also releases the "hold leverage" toggle.
  const {
    draggedLeverage,
    leverageDraft,
    setLeverageDraft,
    onSliderChange,
    commitLeverageDraft,
    clearDraggedLeverage,
  } = useDraggedLeverage({ market, onExplicitChange: () => setLockLeverage(false) })
  // Expanded by default: this flow always carries a swap leg, so MarginPriceImpactRow can have
  // something to say — and Confirm broadcasts directly, with no later review of the fill. (Add and
  // Withdraw stay collapsed: a pure deposit/withdrawal produces no effectivePrice, so the row is inert.)
  const [isExpanded, setIsExpanded] = useState(true)

  // Keeps the pre-fill live off the 20s position poll while the input is untouched; once dirty this
  // must never fire again — a plain effect gated on marginDirty, not a useRef guard (repo rule).
  useEffect(() => {
    if (!marginDirty) {
      setMarginInput(
        currentEquityRaw === undefined
          ? ''
          : formatMarginPrefill({ raw: currentEquityRaw, decimals: collateralDecimals }),
      )
    }
  }, [currentEquityRaw, collateralDecimals, marginDirty])

  const mode = computeAdjustMode({ draggedLeverage, lockLeverage })

  // Default pay token = the collateral itself (same default as the add-collateral modal) until the
  // user picks one via the controlled selector. Memoized: the default branch builds a fresh object
  // each render.
  const paymentToken = useMemo(
    () => selectedPaymentToken ?? getMarketDefaultPaymentToken(market),
    [selectedPaymentToken, market],
  )
  const paymentCurrency = useMemo(() => getPaymentCurrency(paymentToken), [paymentToken])
  const paymentLogoUrl = useCurrencyInfo(currencyId(paymentCurrency))?.logoUrl ?? undefined
  const isPaymentTokenCollateral = !isPaymentTokenDifferentFromCollateral({ token: paymentToken, market })

  const { price: paymentTokenPriceObj } = useUSDCPrice(paymentCurrency)
  const paymentTokenUsdPrice = paymentTokenPriceObj ? Number(paymentTokenPriceObj.toSignificant(18)) : undefined
  // Collateral's USD price without a second remote lookup: LONG collateral IS the volatile asset
  // (mark IS its USD price); SHORT collateral is the ~$1 stable leg (same convention as collateralUsdValue).
  const collateralUsdPrice = direction === 'SHORT' ? 1 : mark

  const deltaE =
    currentEquityRaw === undefined
      ? 0n
      : deriveEquityDeltaRaw({ marginInput, marginInputDirty: marginDirty, currentEquityRaw, collateralDecimals })
  const funding: AdjustFunding = deriveAdjustFunding({
    deltaCollateralRaw: deltaE,
    paymentTokenDecimals: paymentToken.decimals,
    collateralDecimals,
    isPaymentTokenCollateral,
    collateralUsdPrice,
    paymentTokenUsdPrice,
  })

  // The POSITION's mark is polled apart from the quote, and TWO readouts depend on that gap: the impact
  // row captions itself as delayed, and the before/after section withholds its liquidation-distance
  // suffix. Prune this from either consumer and the epoch-mixed figure comes back silently.

  const markIsStale = useMarginPositionMarkIsStale()

  const controller = useMarginAdjustController({
    position,
    market,
    funding,
    mode,
    action: 'adjust',
    paymentToken,
    onClose,
  })

  const displayedLeverage = computeDisplayedLeverage({
    mode,
    currentLeverage: controller.currentLeverage,
    collateral,
    debt,
    mark,
    deltaE,
    collateralDecimals,
    direction,
    venueCap: controller.venueCap,
  })

  // No baseline means no range: measuring "Min 0 · Max 10 WETH" from an equity the modal just declared
  // unknowable states a bound it cannot support, and a defined max is what re-arms the Max affordance.
  const { min: minMarginHuman, max: maxMarginHuman } =
    currentEquityHuman === undefined
      ? { min: undefined, max: undefined }
      : computeMarginHelperRange({
          currentEquityHuman,
          maxWithdrawableRaw: controller.maxWithdrawableRaw,
          collateralDecimals,
          spendableBalanceRaw: controller.spendableBalanceRaw,
          paymentTokenDecimals: paymentToken.decimals,
          isPaymentTokenCollateral,
          paymentTokenUsdPrice,
          collateralUsdPrice,
        })

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl
  const debtLogos = { url: debtLogoUrl ?? undefined, symbol: marginUnwrapSymbol(market.debt) }
  // The Size row reads the EXPOSURE leg — a short's is its debt leg, a long's its collateral.
  const sizeLogos =
    direction === 'SHORT' ? debtLogos : { url: collateralLogoUrl ?? undefined, symbol: market.displaySymbol }
  const { depositAmountHuman, depositUsdValue, withdrawAmountHuman, equityInHuman } = computeFundingDisplay({
    funding,
    paymentToken,
    collateralDecimals,
    paymentTokenUsdPrice,
    equityInRaw: controller.equityInRaw,
    isPaymentTokenCollateral,
    isQuoteStale: controller.isEditStale,
  })

  const marginInputHuman = Number(marginInput) || 0
  const marginInputUsd = collateralUsdValue({ collateralAmount: marginInputHuman, mark, direction })
  // Symbol once, on the last figure — three of them in a 4pt caption is noise.
  const formatMargin = (value: number): string => formatNumberOrString({ value, type: NumberType.TokenNonTx })
  const helperCaption = t('margin.adjustPosition.current', {
    amount: currentEquityHuman === undefined ? '—' : formatMargin(currentEquityHuman),
    min: minMarginHuman !== undefined ? formatMargin(minMarginHuman) : '—',
    max: maxMarginHuman !== undefined ? `${formatMargin(maxMarginHuman)} ${market.displaySymbol}` : '—',
  })
  // The payment-token and staleness terms live in computeFundingDisplay now, so an undefined figure is
  // the single signal that this line must not render.
  const conversionCaption =
    equityInHuman !== undefined
      ? t('margin.payment.conversion', {
          paymentAmount: formatNumberOrString({ value: depositAmountHuman, type: NumberType.TokenNonTx }),
          paymentSymbol: paymentToken.symbol,
          equity: formatNumberOrString({ value: equityInHuman, type: NumberType.TokenNonTx }),
          collateralSymbol: market.displaySymbol,
        })
      : undefined

  // The sheet cannot state this position's equity, so its margin field is suppressed and the footer
  // says so. The CTA takes no extra term for it: `deltaE` is already forced to 0 in this state, so no
  // funding can reach the request, and a LEVERAGE-only adjust needs no mark at all — the
  // Change-leverage sheet performs exactly that on the same position. Disabling Confirm here refused a
  // valid action while a live slider quoted a real projection underneath it.
  const marginUnpriceable = currentEquityRaw === undefined

  const onMarginInputChange = useEvent((text: string) => {
    setMarginInput(text)
    setMarginDirty(true)
  })
  const onFillMaxMargin = useEvent(() => {
    if (maxMarginHuman === undefined) {
      return
    }
    setMarginInput(floorToSubmittable({ value: maxMarginHuman, decimals: collateralDecimals }))
    setMarginDirty(true)
  })
  const onToggleLockLeverage = useEvent((next: boolean) => {
    setLockLeverage(next)
    if (next) {
      clearDraggedLeverage()
    }
  })
  const onOpenSelector = useEvent(() => setIsSelectingPayment(true))
  const onCloseSelector = useEvent(() => setIsSelectingPayment(false))
  const onSelectPaymentToken = useEvent((token: MarginPaymentToken | undefined) => {
    setSelectedPaymentToken(token)
    setIsSelectingPayment(false)
  })
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  // A switch over literal t() calls, not a Record keyed by the kind — i18next-parser prunes keys it
  // cannot see as literals, and `default:` rather than `case 'noChange'` keeps consistent-return happy.
  const ctaKind = getMarginAdjustCtaKind({ funding, mode, currentLeverage: controller.currentLeverage })
  const ctaLabel = ((): string => {
    switch (ctaKind) {
      case 'deposit':
        return t('margin.adjustPosition.cta.deposit')
      case 'withdraw':
        return t('margin.adjustPosition.cta.withdraw')
      case 'leverage':
        return t('margin.adjustPosition.cta.leverage')
      default:
        return t('margin.adjustPosition.cta.noChange')
    }
  })()

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginAdjustPosition}
      title={t('margin.adjustPosition.title')}
      isOpen={isOpen}
      onClose={onClose}
      ctaLabel={ctaLabel}
      ctaDisabled={controller.confirmDisabled}
      ctaLoading={controller.isQuoteLoading || controller.isEditStale}
      ctaTestID={TestID.MarginAdjustPositionCta}
      footerMessage={
        <MarginActionFooterMessage
          isPlanInFlight={controller.isPlanInFlight}
          marginUnpriceable={marginUnpriceable}
          insufficientBalance={controller.insufficientBalance}
          overMax={controller.overMax}
          paymentSymbol={paymentToken.symbol}
        />
      }
      overlay={
        /* Controlled instance: selection routes to local state, never the shared open-form store. */
        <MarginPaymentTokenSelector
          isOpen={isSelectingPayment}
          market={market}
          onClose={onCloseSelector}
          onSelect={onSelectPaymentToken}
        />
      }
      onConfirm={controller.onConfirm}
    >
      <MarginPairHeading market={market} variant="direction" position={position} />
      <MarginExcludedVenueNotice venue={market.venue} />

      {/* A live field over a baseline the sheet has already called unknowable: `deltaE` is forced to 0,
          so typing moves nothing, the helper reads "Current — · Min — · Max —", and the CTA never
          arms — with nothing on screen saying why. Suppressed and explained in the footer, the way
          Withdraw and Change leverage already handle their own dead-control states. */}
      {marginUnpriceable ? null : (
        <MarginAmountField
          label={t('margin.adjustPosition.marginLabel')}
          inputAriaLabel={t('margin.adjustPosition.marginLabel')}
          value={marginInput}
          onChangeText={onMarginInputChange}
          maxDecimals={collateralDecimals}
          chip={{ kind: 'static', symbol: market.displaySymbol, logoUrl: collateralLogoUrl ?? undefined }}
          usdCaption={formatNumberOrString({ value: marginInputUsd, type: NumberType.FiatStandard })}
          helperCaption={helperCaption}
        />
      )}

      <MarginAdjustLeverageSection
        displayedLeverage={displayedLeverage}
        leverageDraft={leverageDraft}
        cap={controller.cap}
        lltvWad={market.lltvWad}
        direction={direction}
        lockLeverage={lockLeverage}
        onLeverageDraftChange={setLeverageDraft}
        onCommitLeverageDraft={commitLeverageDraft}
        onSliderChange={onSliderChange}
        onToggleLockLeverage={onToggleLockLeverage}
      />

      {/* After both cards, not between them: Margin and Leverage are the pair the user controls, and
          the funding line is what follows from them. It also divides the controls from the outcomes. */}
      {/* hasSpendableBalance is keyed on the value Max actually fills, not on the balance:
          computeMarginHelperRange returns a spendable balance with an undefined max whenever the
          cross-token conversion can't be priced, and onFillMaxMargin bails on exactly that. */}
      <MarginAdjustFundingRow
        funding={funding}
        paymentToken={paymentToken}
        paymentLogoUrl={paymentLogoUrl}
        depositAmountDisplay={formatNumberOrString({ value: depositAmountHuman, type: NumberType.TokenNonTx })}
        depositUsdCaption={
          depositUsdValue !== undefined
            ? formatNumberOrString({ value: depositUsdValue, type: NumberType.FiatStandard })
            : ''
        }
        hasSpendableBalance={maxMarginHuman !== undefined}
        conversionCaption={conversionCaption}
        withdrawAmountDisplay={`${formatNumberOrString({ value: withdrawAmountHuman, type: NumberType.TokenNonTx })} ${market.displaySymbol}`}
        onOpenSelector={onOpenSelector}
        onFillMax={onFillMaxMargin}
      />

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
        // The payment leg only exists on a deposit: a non-collateral token survives the user lowering
        // margin into a withdrawal, which runs the leverage swap alone.
        // Also gated on the mode: `drift` sends no target, so the debt is held constant and a
        // cross-token deposit is a single swap leg — the same request shape MarginAddModal makes, which
        // discloses the per-leg figure. Without this the two screens quote different slippage for the
        // identical route.
        compoundsSlippage={!isPaymentTokenCollateral && funding.kind === 'deposit' && mode.kind !== 'drift'}
        gasDisplay={controller.gasDisplay}
        extraRows={
          controller.displayQuote ? (
            <MarginAdjustQuoteRows
              markIsStale={markIsStale}
              quote={controller.displayQuote}
              position={position}
              direction={direction}
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
