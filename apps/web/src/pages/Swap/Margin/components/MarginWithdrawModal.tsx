import { CurrencyAmount } from '@uniswap/sdk-core'
import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { parseUnits } from '~/chains'
import { type MarginMarket } from '~/constants/margin'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import {
  getMarginEquityCurrency,
  marginAssetCurrencyId,
  marginTokenCurrencyId,
} from '~/features/margin/utils/marginCurrencies'
import { marginPositionDebt } from '~/features/margin/utils/marginPositionRow'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { MarginAdjustBeforeAfterSection } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginAdjustQuoteRows } from '~/pages/Swap/Margin/components/MarginAdjustQuoteRows'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { useMarginAdjustAmountInput } from '~/pages/Swap/Margin/hooks/useMarginAdjustAmountInput'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'

// computeMaxWithdrawable returns the amount that lands health EXACTLY on the floor, so requesting it
// verbatim rounds a hair under and the server rejects the quote outright (measured on mainnet: a
// 0.0012423 ETH ceiling 422s, 0.00120 prices fine). Interest accruing between the preview quote and
// the submit widens the same gap. Back MAX off by half a percent of the ceiling, which is enough that
// the button always produces a submittable amount.
const MAX_FILL_HAIRCUT_BPS = 50n
const BPS_DENOM = 10_000n

// Withdraw margin: a withdraw with no leverage target. The amount is typed in COLLATERAL units —
// withdrawAmount's wire unit — with a static chip, since the primitive returns the collateral token
// only. The ceiling is quote.maxWithdrawable, which arrives from preview mode on open before the
// user types anything.
export function MarginWithdrawModal({
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
  // The payout token itself: a withdrawal pays out in the collateral, so a WETH position pays WETH.
  const collateralCurrency = useMemo(
    () => getMarginEquityCurrency({ ...market, shouldUseNativeEquity: false }),
    [market],
  )
  const collateralCurrencyInfo = useCurrencyInfo(currencyId(collateralCurrency))
  const { tokenAmount: amount, panelProps } = useMarginAdjustAmountInput(collateralCurrency)
  const [expandedOverride, setExpandedOverride] = useState<boolean | undefined>(undefined)

  const collateralDecimals = market.collateral.decimals

  const funding: AdjustFunding = useMemo(() => {
    const trimmed = amount.trim()
    // isFinite rejects "Infinity"; parseUnits still throws on "1e5" / "0x10" / over-long fractions,
    // and an uncaught throw in useMemo unmounts the modal.
    if (!trimmed || !Number.isFinite(Number(trimmed)) || Number(trimmed) <= 0) {
      return { kind: 'none' }
    }
    try {
      return { kind: 'withdraw', withdrawAmountRaw: parseUnits(trimmed, collateralDecimals).toString() }
    } catch {
      return { kind: 'none' }
    }
  }, [amount, collateralDecimals])

  // No paymentToken: the controller defaults it, and this modal never displays one.
  // The POSITION's mark is polled apart from the quote, and TWO readouts depend on that gap: the impact
  // row captions itself as delayed, and the before/after section withholds its liquidation-distance
  // suffix. Prune this from either consumer and the epoch-mixed figure comes back silently.
  const markIsStale = useMarginPositionMarkIsStale()
  const controller = useMarginAdjustController({
    position,
    market,
    funding,
    mode: { kind: 'drift' },
    action: 'withdraw',
    onClose,
  })

  const maxWithdrawableRaw = controller.maxWithdrawableRaw
  const hasCeiling = maxWithdrawableRaw !== undefined
  const nothingAvailable = hasCeiling && BigInt(maxWithdrawableRaw) === 0n

  // With nothing withdrawable the amount field is suppressed entirely, leaving no visible reason why.
  // Borrowing — one tap away in every other state — is that reason, so open the section by default here.
  // Still an override, not a lock: the user can collapse it.
  const isExpanded = expandedOverride ?? nothingAvailable
  const toggleExpanded = useEvent(() => setExpandedOverride(!isExpanded))

  const direction = position.direction

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl
  const debtLogos = { url: debtLogoUrl ?? undefined, symbol: marginUnwrapSymbol(market.debt) }
  // The Size row reads the EXPOSURE leg — a short's is its debt leg, a long's its collateral.
  const sizeLogos =
    direction === MarginDirection.SHORT
      ? debtLogos
      : { url: collateralLogoUrl ?? undefined, symbol: market.displaySymbol }
  const hasDebt = BigInt(marginPositionDebt(position)) !== 0n

  return (
    <MarginActionModalShell
      modalName={ModalName.MarginWithdraw}
      title={t('margin.withdraw.title')}
      isOpen={isOpen}
      onClose={onClose}
      ctaLabel={t('margin.withdraw.cta')}
      ctaDisabled={controller.confirmDisabled}
      ctaLoading={controller.isQuoteLoading || controller.isEditStale}
      ctaTestID={TestID.MarginWithdrawCta}
      footerMessage={
        nothingAvailable ? (
          <Text variant="body4" color="$statusCritical" textAlign="center">
            {t('margin.withdraw.nothingAvailable')}
          </Text>
        ) : (
          <MarginActionFooterMessage
            isPlanInFlight={controller.isPlanInFlight}
            insufficientBalance={false}
            overMax={controller.overMax}
          />
        )
      }
      onConfirm={controller.onConfirm}
    >
      <MarginPairHeading market={market} variant="direction" position={position} />
      <MarginExcludedVenueNotice venue={market.venue} />
      {/* A live input above a dead max reads as usable; with no headroom there is nothing to type. */}
      {nothingAvailable ? null : (
        <CurrencyInputPanel
          {...panelProps}
          currencyField={CurrencyField.INPUT}
          currencyInfo={collateralCurrencyInfo}
          currencyBalance={
            hasCeiling
              ? CurrencyAmount.fromRawAmount(
                  collateralCurrency,
                  ((BigInt(maxWithdrawableRaw) * (BPS_DENOM - MAX_FILL_HAIRCUT_BPS)) / BPS_DENOM).toString(),
                )
              : undefined
          }
          showFiatToggleIcon
          customPanelStyle={{ backgroundColor: '$surface2' }}
        />
      )}
      {/* The server always reserves a dust remainder, so Adjust can never empty the position. */}
      {nothingAvailable || hasDebt ? null : (
        <Text variant="body4" color="$neutral3">
          {t('margin.withdraw.fullExitHint')}
        </Text>
      )}
      {controller.quoteErrorResult && !controller.overMax ? (
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
