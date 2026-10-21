import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { formatUnits, parseUnits } from '~/chains'
import { type MarginMarket } from '~/constants/margin'
import { MarginAdjustBeforeAfterSection } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginAdjustQuoteRows } from '~/pages/Swap/Margin/components/MarginAdjustQuoteRows'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { MarginPaymentTokenSelector } from '~/pages/Swap/Margin/components/MarginPaymentTokenSelector'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginAmountField } from '~/pages/Swap/Margin/components/shared/MarginAmountField'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import {
  getMarketDefaultPaymentToken,
  getPaymentCurrency,
  isPaymentTokenDifferentFromCollateral,
  marginAssetCurrencyId,
  marginTokenCurrencyId,
} from '~/pages/Swap/Margin/marginCurrencies'
import { conversionCaptionEquity } from '~/pages/Swap/Margin/marginFormat'
import { marginPositionTokens } from '~/pages/Swap/Margin/marginPositionRow'
import { marginRowDirection, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

// Add margin: a deposit with no leverage target. The amount is typed in PAYMENT-TOKEN units, which is
// the wire field, so paymentAmountRaw passes straight through with no USD conversion. mode is
// 'drift' — with targetLeverageX18 absent the server holds DEBT constant, so the deposit lowers
// leverage (collateral grows, debt does not).
export function MarginAddModal({
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
  const [amount, setAmount] = useState('')
  const [selectedPaymentToken, setSelectedPaymentToken] = useState<MarginPaymentToken | undefined>(undefined)
  const [isSelectingPayment, setIsSelectingPayment] = useState(false)
  const paymentToken = useMemo(
    () => selectedPaymentToken ?? getMarketDefaultPaymentToken(market),
    [selectedPaymentToken, market],
  )
  const paymentCurrency = useMemo(() => getPaymentCurrency(paymentToken), [paymentToken])
  // Cross-token adds are NOT pure deposits — they swap payment→collateral, so MarginPriceImpactRow
  // can have an adverse-fill warning to show, and it must not sit behind a toggle the user has no
  // reason to open. A same-token add produces no effectivePrice, so the row is inert and stays collapsed.
  //
  // Derived, not a useState initializer: at mount the payment token IS the collateral (nothing is
  // selected yet), so an initializer would evaluate false once and never re-run when the user picks a
  // cross-token payment — collapsing the row on exactly the case it exists for. Still an override, so
  // the user can collapse it.
  const [expandedOverride, setExpandedOverride] = useState<boolean | undefined>(undefined)
  const isExpanded = expandedOverride ?? isPaymentTokenDifferentFromCollateral({ token: paymentToken, market })

  const paymentLogoUrl = useCurrencyInfo(currencyId(paymentCurrency))?.logoUrl ?? undefined

  // The amount is already in payment-token units — the exact wire field. Blank input must be
  // 'none', never a deposit with an empty amount (see the controller's caller contract).
  const funding: AdjustFunding = useMemo(() => {
    const trimmed = amount.trim()
    // Number.isFinite (not isNaN) so "Infinity" is rejected too. parseUnits still throws on inputs
    // Number() accepts — "1e5", "0x10", more fraction digits than `decimals` — and an uncaught throw
    // in useMemo unmounts the modal, so it is wrapped.
    if (!trimmed || !Number.isFinite(Number(trimmed)) || Number(trimmed) <= 0) {
      return { kind: 'none' }
    }
    try {
      return { kind: 'deposit', paymentAmountRaw: parseUnits(trimmed, paymentToken.decimals).toString() }
    } catch {
      return { kind: 'none' }
    }
  }, [amount, paymentToken.decimals])

  // The POSITION's mark is polled apart from the quote, and TWO readouts depend on that gap: the impact
  // row captions itself as delayed, and the before/after section withholds its liquidation-distance
  // suffix. Prune this from either consumer and the epoch-mixed figure comes back silently.

  const markIsStale = useMarginPositionMarkIsStale()

  const controller = useMarginAdjustController({
    position,
    market,
    funding,
    mode: { kind: 'drift' },
    action: 'add',
    paymentToken,
    onClose,
  })

  const onFillMax = useEvent(() => {
    if (controller.spendableBalanceRaw !== undefined) {
      setAmount(formatUnits(BigInt(controller.spendableBalanceRaw), paymentToken.decimals))
    }
  })
  const onOpenSelector = useEvent(() => setIsSelectingPayment(true))
  const onCloseSelector = useEvent(() => setIsSelectingPayment(false))
  const onSelectPaymentToken = useEvent((token: MarginPaymentToken | undefined) => {
    setSelectedPaymentToken(token)
    setIsSelectingPayment(false)
  })
  const toggleExpanded = useEvent(() => setExpandedOverride(!isExpanded))

  const isPaymentTokenCollateral = !isPaymentTokenDifferentFromCollateral({ token: paymentToken, market })
  // The same rule the open form and the adjust sheet use. Locally this tested `!== undefined`, which
  // the truthy STRING '0' walks through into "≈ 0"; it consulted no freshness, so mid-debounce the
  // sentence paired the live input with the equity quoted for the previous one (and a cleared field
  // with a blank payment half); and it decoded through a bare BigInt, which throws mid-render.
  const equityInHuman = conversionCaptionEquity({
    equityInRaw: controller.equityInRaw,
    decimals: market.collateral.decimals,
    isPaymentTokenCollateral,
    isQuoteStale: controller.isEditStale,
  })

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl
  const debtLogos = { url: debtLogoUrl ?? undefined, symbol: marginUnwrapSymbol(market.debt) }
  // The Size row reads the EXPOSURE leg — a short's is its debt leg, a long's its collateral.
  const sizeLogos =
    position.direction === 'SHORT' ? debtLogos : { url: collateralLogoUrl ?? undefined, symbol: market.displaySymbol }

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginAdd}
      title={t('margin.add.title')}
      isOpen={isOpen}
      onClose={onClose}
      ctaLabel={t('margin.add.cta')}
      ctaDisabled={controller.confirmDisabled}
      ctaLoading={controller.isQuoteLoading || controller.isEditStale}
      ctaTestID={TestID.MarginAddCta}
      footerMessage={
        <MarginActionFooterMessage
          isPlanInFlight={controller.isPlanInFlight}
          insufficientBalance={controller.insufficientBalance}
          overMax={controller.overMax}
          paymentSymbol={paymentToken.symbol}
        />
      }
      overlay={
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
      <MarginAmountField
        inputAriaLabel={t('margin.add.amountLabel')}
        value={amount}
        onChangeText={setAmount}
        maxDecimals={paymentToken.decimals}
        chip={{
          kind: 'select',
          symbol: paymentToken.symbol,
          logoUrl: paymentLogoUrl,
          chainId: paymentToken.chainId,
          ariaLabel: t('margin.payment.selector.title'),
          onPress: onOpenSelector,
        }}
        trailing={
          controller.spendableBalanceRaw !== undefined
            ? {
                kind: 'action',
                label: `${formatNumberOrString({
                  value: Number(formatUnits(BigInt(controller.spendableBalanceRaw), paymentToken.decimals)),
                  type: NumberType.TokenNonTx,
                })} ${paymentToken.symbol}`,
                ariaLabel: t('margin.add.useMaxBalance'),
                onPress: onFillMax,
              }
            : undefined
        }
      />
      {/* Cross-token deposits land a different amount of collateral than was paid. */}
      {equityInHuman !== undefined ? (
        <Text variant="body3" color="$neutral2">
          {t('margin.payment.conversion', {
            paymentAmount: amount,
            paymentSymbol: paymentToken.symbol,
            equity: formatNumberOrString({ value: equityInHuman, type: NumberType.TokenNonTx }),
            collateralSymbol: market.displaySymbol,
          })}
        </Text>
      ) : null}
      {controller.quoteErrorResult ? (
        <Text variant="body3" color="$statusCritical">
          {controller.quoteErrorResult.message}
        </Text>
      ) : null}
      <MarginAdjustBeforeAfterSection
        markIsStale={markIsStale}
        hasLeverageControl={false}
        displayQuote={controller.displayQuote}
        position={position}
        showInitialSkeleton={controller.showInitialSkeleton}
        dim={controller.dimBeforeAfter}
        sizeLogos={sizeLogos}
        // Put the two rows that carry the meaning of this change next to each other.
        rowOrder="liquidationSecond"
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
