import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import {
  MarginApiClient,
  type MarginActivePosition,
  type MarginCreatePlanRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { buildMarginQuoteRequest } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/buildMarginQuoteRequest'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginExplainerContent, MarginExplainerTooltip } from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import { isPlanForAccount } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { useIsPlanInFlight } from '~/pages/Swap/Margin/hooks/useIsPlanInFlight'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import { useMarginQuote } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import { getCloseConfirmDisabled, isCloseUnderwater } from '~/pages/Swap/Margin/marginCloseGate'
import { marginAssetCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import {
  bpsToPercent,
  collateralUsdValue,
  formatSignedFiat,
  marginPriceUnitSymbol,
  rawToNumber,
} from '~/pages/Swap/Margin/marginFormat'
import { buildMarginEstPnlBreakdown } from '~/pages/Swap/Margin/marginPnlExplainer'
import { marginPositionDebt, marginPositionSubId, marginPositionTokens } from '~/pages/Swap/Margin/marginPositionRow'
import { marginPriceImpactBps } from '~/pages/Swap/Margin/marginPriceImpact'
import { marginRowDirection, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginPositionMark, marginUsdBasis } from '~/pages/Swap/Margin/marginUsdPnl'

// The primary outcome block: quote-error / underwater / the "Withdrawing" section (est receive + USD +
// Est. PnL + logo).
function CloseOutcome({
  quoteError,
  underwater,
  displaySymbol,
  collateralLogoUrl,
  estReceive,
  estReceiveUsd,
  pnl,
  costBasisUsd,
  slippagePercent,
}: {
  quoteError: boolean
  underwater: boolean
  displaySymbol: string
  collateralLogoUrl?: string
  // Absent until a quote exists — a debt-free close has none until Confirm fetches one.
  estReceive: number | undefined
  estReceiveUsd: number | undefined
  pnl?: number
  costBasisUsd: number | undefined
  // Undefined on a debt-free close: nothing is sold, so there is no slippage to warn about.
  slippagePercent: number | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  if (quoteError) {
    return (
      <Text variant="body3" color="$statusCritical">
        {t('margin.error.quoteFailed')}
      </Text>
    )
  }
  if (underwater) {
    return (
      <Text variant="body3" color="$statusCritical">
        {t('margin.manage.underwater')}
      </Text>
    )
  }
  return (
    <Flex row justifyContent="space-between" alignItems="flex-start" gap="$spacing12">
      <Flex gap="$spacing2" flexShrink={1}>
        <Text variant="body3" color="$neutral2">
          {t('margin.close.withdrawing')}
        </Text>
        <Text variant="heading2" color="$neutral1">
          {estReceive === undefined
            ? '—'
            : `${formatNumberOrString({ value: estReceive, type: NumberType.TokenTx })} ${displaySymbol}`}
        </Text>
        {estReceiveUsd !== undefined ? (
          <Text variant="body3" color="$neutral2">
            {formatNumberOrString({ value: estReceiveUsd, type: NumberType.FiatStandard })}
          </Text>
        ) : null}
        {pnl !== undefined && costBasisUsd !== undefined && estReceiveUsd !== undefined ? (
          <MarginExplainerTooltip
            content={
              <MarginExplainerContent
                estimate
                slippagePercent={slippagePercent}
                rows={
                  buildMarginEstPnlBreakdown({
                    costBasisUsd,
                    proceedsUsd: estReceiveUsd,
                    estPnlUsd: pnl,
                    formatFiat: (value) => formatNumberOrString({ value, type: NumberType.FiatStandard }),
                  }).rows
                }
              />
            }
          >
            <Text
              variant="body3"
              color={pnl >= 0 ? '$statusSuccess' : '$statusCritical'}
              testID={TestID.MarginEstPnlTrigger}
            >
              {t('margin.manage.estPnl')}:{' '}
              {formatSignedFiat({
                value: pnl,
                format: (value) => formatNumberOrString({ value, type: NumberType.FiatStandard }),
              })}
            </Text>
          </MarginExplainerTooltip>
        ) : null}
      </Flex>
      <TokenLogo size={36} url={collateralLogoUrl} symbol={displaySymbol} chainId={MARGIN_CHAIN_ID} hideNetworkLogo />
    </Flex>
  )
}

// The Show-more detail rows: mark price, slippage (debt-bearing close only), and accrued interest.
function CloseDetailRows({
  hasDebt,
  slippageBps,
  accrued,
  debtSymbol,
  markLine,
  priceImpactBps,
  markIsStale,
}: {
  hasDebt: boolean
  slippageBps: number
  accrued?: number
  debtSymbol: string
  priceImpactBps?: number
  // Freshness of the mark the impact was measured against, from the same caller that supplied it.
  markIsStale: boolean
  markLine: string
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  return (
    <Flex gap="$spacing12">
      <MarginDetailRow label={t('margin.close.markPrice')} value={markLine} />
      <MarginPriceImpactRow impactBps={priceImpactBps} markIsStale={markIsStale} />
      {hasDebt ? (
        <MarginDetailRow label={t('margin.fees.maxSlippage')} value={`${bpsToPercent(slippageBps)}%`} />
      ) : null}
      <MarginDetailRow
        label={t('margin.drawer.interestAccrued')}
        value={
          accrued !== undefined
            ? `${formatNumberOrString({ value: accrued, type: NumberType.TokenNonTx })} ${debtSymbol}`
            : '—'
        }
      />
    </Flex>
  )
}

// Close modal: full-exit only. A close quote with an underwater guard and a debt-free branch, plus detail
// rows. Slippage comes from the form store and is threaded through both the quote and the CLOSE request so
// the displayed value is the executed value.
export function MarginCloseModal({
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
  const account = useAccount()
  const { executePlan } = useExecuteMarginPlan()
  const isPlanInFlight = useIsPlanInFlight()
  const currencyInfos = useMarginCurrencyInfos()
  const { slippageToleranceBps } = useMarginFormStore((s) => ({ slippageToleranceBps: s.slippageToleranceBps }))

  // Detail rows start expanded — this is the final confirmation before closing; the toggle collapses them.
  const [isExpanded, setIsExpanded] = useState(true)
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))

  const collateralDecimals = market.collateral.decimals
  const debtDecimals = market.debt.decimals
  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n

  // The close action key names no amount (the server always closes in full), so the position's debt
  // is a fire/no-fire gate rather than a wire field: a debt-free position never gets a polled quote
  // here — onConfirm fetches one directly below.
  const { quote, isQuoteLoading, isDebouncing, isPlaceholderData, quoteError } = useMarginQuote({
    position,
    market,
    swapper: account.address,
    action: 'close',
    slippageToleranceBps,
    enabled: hasDebt,
  })

  // '0' is the wire's "no price", not a zero price, so every figure below reads the mark through this
  // guarded decoder. Valuing a LONG's proceeds at a zero mark reports $0.00 coming back and prices
  // realized PnL as `0 − costBasis` — the entire basis rendered as a loss, on a close that in fact
  // returns the whole position. The revert guard takes it too, undefined and all: it fails OPEN on the
  // one branch that needs a mark, because refusing a close on an unpriceable position would strand the
  // funds it is trying to release. Handing it the RAW value inverted that — a SHORT's held collateral
  // collapsed to its equity alone and a healthy short read as underwater, blocked from its only exit.
  const usableMark = marginPositionMark({ position })
  const direction = marginRowDirection({ direction: position.direction, ...marginPositionTokens(position) })

  // The exit swap sells collateral to buy the debt being repaid. The mark comes from the position
  // rather than the quote, so it is polled separately and can lag the quote it is divided into —
  // which is what the row's caption discloses once that lag crosses the freshness bound.
  const markIsStale = useMarginPositionMarkIsStale()
  const priceImpactBps = marginPriceImpactBps({
    execPriceX18: quote?.display.effectivePrice,
    markPriceX18: position.oraclePrice,
    swapSide: 'SELL_COLLATERAL',
    direction,
  })

  // The swap needs more collateral than the position holds (near/underwater) → it would revert. The
  // slippage-padded bound is the right one to guard on: it is what the transaction may actually spend.
  const underwater = isCloseUnderwater({
    maxCollateralIn: quote?.legs[0]?.bounds.decrease?.maxCollateralIn,
    direction,
    size: position.size,
    equity: position.equity,
    debt: marginPositionDebt(position),
    collateralDecimals,
    debtDecimals,
    mark: usableMark,
  })
  // display.collateralReturned is already the net proceeds (held minus sold) — no more manual subtraction.
  // undefined, NOT 0, when there is no quote yet: a debt-free close has no polled quote for the whole
  // life of the screen (the hook is `enabled: hasDebt`), and a zero here renders "Withdrawing 0 SYM" /
  // "$0.00" and prices realized PnL as `0 − costBasis`, painting the entire basis as a loss — beside a
  // live CTA that goes on to close correctly.
  const estReceive =
    quote?.display.collateralReturned !== undefined
      ? rawToNumber({ raw: quote.display.collateralReturned, decimals: collateralDecimals })
      : undefined
  const estReceiveUsd =
    estReceive === undefined || (usableMark === undefined && direction !== MarginDirection.SHORT)
      ? undefined
      : // A SHORT's collateral is the stable leg, so its USD value never reads the mark — which is why
        // the fallback below is unreachable for the only branch that could see it.
        collateralUsdValue({ collateralAmount: estReceive, mark: usableMark ?? 0, direction })
  // Realized PnL is what comes back less what went in, both in USD.
  const basis = marginUsdBasis({ position, market })
  const pnl = basis && estReceiveUsd !== undefined ? estReceiveUsd - basis.costBasisUsd : undefined

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const markUnitSymbol = marginPriceUnitSymbol({ collateral: market.collateral, debt: market.debt, direction })
  const markLine =
    usableMark === undefined
      ? '—'
      : `1 ${markUnitSymbol} = ${formatNumberOrString({ value: usableMark, type: NumberType.FiatTokenPrice })}`
  const accrued =
    position.accruedInterest !== undefined
      ? rawToNumber({ raw: position.accruedInterest, decimals: debtDecimals })
      : undefined

  const subId = marginPositionSubId(position)
  const canManage = subId !== undefined && subId !== ''
  // The debt-free arm fetches its quote on press rather than from the polled hook (which is
  // `enabled: hasDebt`), so it needs its own in-flight and error state — the gate short-circuits on
  // `!hasDebt` and skips every quote-freshness term.
  const [isFetchingDebtFreeQuote, setIsFetchingDebtFreeQuote] = useState(false)
  const [debtFreeQuoteFailed, setDebtFreeQuoteFailed] = useState(false)
  const confirmDisabled = getCloseConfirmDisabled({
    canManage,
    hasAccount: Boolean(account.address),
    hasDebt,
    hasQuote: Boolean(quote),
    isQuoteLoading,
    isDebouncing,
    isPlaceholderData,
    hasQuoteError: Boolean(quoteError),
    underwater,
    isPlanInFlight,
    isFetchingDebtFreeQuote,
  })
  const showDetails = !quoteError && !debtFreeQuoteFailed && !underwater

  // Runs after the debt-free quote round-trip, so it must read the CURRENT account rather than the one
  // captured at press. useEvent invokes the latest render's closure, which is what makes that possible
  // without a ref. The executor refuses to sign a plan minted under a prior wallet either way, but only
  // after the create POST has already minted it — this keeps the orphan from being created at all.
  const startDebtFreeClose = useEvent(
    ({ swapper, quote: debtFreeQuote }: { swapper: string; quote: MarginQuoteResponse }): void => {
      if (!isPlanForAccount({ planSwapper: swapper, accountAddress: account.address })) {
        // The sheet is showing the PREVIOUS wallet's position, so there is nothing here for the current
        // one to confirm. Returning silently would clear the spinner and leave Close reading as if it
        // had done nothing; dismiss instead and let the positions query re-derive what this wallet holds.
        onClose()
        return
      }
      void executePlan({ request: { chainId: MARGIN_CHAIN_ID, swapper, marginQuote: debtFreeQuote } })
      onClose()
    },
  )

  // Every non-RECOVER create posts a quote verbatim — no restated fields, no echo to build. A
  // debt-bearing close already has one polled above; a debt-free close never does (the polled hook
  // gates on a nonzero debt, since the close action key names no amount), so it fetches one directly.
  const onConfirm = useEvent(() => {
    if (confirmDisabled || !account.address) {
      return
    }
    const swapper = account.address
    if (quote) {
      const request: MarginCreatePlanRequest = { chainId: MARGIN_CHAIN_ID, swapper, marginQuote: quote }
      void executePlan({ request })
      onClose()
      return
    }
    if (hasDebt) {
      return
    }
    const quoteRequest = buildMarginQuoteRequest({
      actionKey: 'close',
      positionChainId: MARGIN_CHAIN_ID,
      exposureToken: position.exposureToken.address,
      counterToken: position.counterToken.address,
      direction: position.direction,
      swapper,
      positionId: position.positionId,
      slippageTolerance: bpsToPercent(slippageToleranceBps),
      // Close pays OUT through a swap, so it names the payout token (the position's collateral — the
      // volatile leg on a long, the stable on a short) and a swapConfig, like the equity keys. No
      // amount: the server closes in full.
      swapConfig: {
        token:
          position.direction === MarginDirection.SHORT ? position.counterToken.address : position.exposureToken.address,
        chainId: MARGIN_CHAIN_ID,
        slippageTolerance: bpsToPercent(slippageToleranceBps),
      },
    })
    if (!quoteRequest) {
      return
    }
    setDebtFreeQuoteFailed(false)
    setIsFetchingDebtFreeQuote(true)
    void (async (): Promise<void> => {
      try {
        const debtFreeQuote = await MarginApiClient.fetchMarginQuote(quoteRequest, {
          tokenDecimals: { exposure: position.exposureToken.decimals, counter: position.counterToken.decimals },
        })
        startDebtFreeClose({ swapper, quote: debtFreeQuote })
      } catch (e) {
        logger.error(e, { tags: { file: 'MarginCloseModal', function: 'onConfirm' } })
        setDebtFreeQuoteFailed(true)
      } finally {
        setIsFetchingDebtFreeQuote(false)
      }
    })()
  })

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginClose}
      title={t('margin.close.title')}
      isOpen={isOpen}
      onClose={onClose}
      ctaLabel={t('margin.manage.closeConfirm')}
      ctaDisabled={confirmDisabled}
      ctaLoading={isFetchingDebtFreeQuote}
      footerMessage={
        isPlanInFlight ? (
          <Text variant="body4" color="$statusWarning" textAlign="center">
            {t('margin.error.planInFlight')}
          </Text>
        ) : null
      }
      onConfirm={onConfirm}
    >
      <MarginPairHeading market={market} variant="venue" />
      <MarginExcludedVenueNotice venue={market.venue} />
      <CloseOutcome
        quoteError={Boolean(quoteError) || debtFreeQuoteFailed}
        underwater={underwater}
        displaySymbol={market.displaySymbol}
        collateralLogoUrl={collateralLogoUrl ?? undefined}
        estReceive={estReceive}
        estReceiveUsd={estReceiveUsd}
        pnl={pnl}
        costBasisUsd={basis?.costBasisUsd}
        slippagePercent={hasDebt ? bpsToPercent(slippageToleranceBps) : undefined}
      />
      {showDetails ? (
        <>
          <MarginShowMoreToggle isExpanded={isExpanded} onToggle={toggleExpanded} />
          {isExpanded ? (
            <CloseDetailRows
              hasDebt={hasDebt}
              slippageBps={slippageToleranceBps}
              accrued={accrued}
              debtSymbol={marginUnwrapSymbol(market.debt)}
              markLine={markLine}
              priceImpactBps={priceImpactBps}
              markIsStale={markIsStale}
            />
          ) : null}
        </>
      ) : null}
    </MarginActionModalShell>
  )
}
