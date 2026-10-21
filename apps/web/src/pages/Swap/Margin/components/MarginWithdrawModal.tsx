import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { formatUnits, parseUnits } from '~/chains'
import { type MarginMarket } from '~/constants/margin'
import { MarginAdjustBeforeAfterSection } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginAdjustQuoteRows } from '~/pages/Swap/Margin/components/MarginAdjustQuoteRows'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { MarginAmountField } from '~/pages/Swap/Margin/components/shared/MarginAmountField'
import { MarginExcludedVenueNotice } from '~/pages/Swap/Margin/components/shared/MarginExcludedVenueNotice'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { getMarginCurrencyInfo, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import { marginAssetCurrencyId, marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import { collateralUsdValue } from '~/pages/Swap/Margin/marginFormat'
import { marginPositionDebt } from '~/pages/Swap/Margin/marginPositionRow'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginPositionMark } from '~/pages/Swap/Margin/marginUsdPnl'

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
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfos = useMarginCurrencyInfos()
  const [amount, setAmount] = useState('')
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

  const onFillMax = useEvent(() => {
    if (maxWithdrawableRaw !== undefined) {
      const ceiling = BigInt(maxWithdrawableRaw)
      setAmount(formatUnits((ceiling * (BPS_DENOM - MAX_FILL_HAIRCUT_BPS)) / BPS_DENOM, collateralDecimals))
    }
  })
  // With nothing withdrawable the amount field is suppressed entirely, leaving no visible reason why.
  // Borrowing — one tap away in every other state — is that reason, so open the section by default here.
  // Still an override, not a lock: the user can collapse it.
  const isExpanded = expandedOverride ?? nothingAvailable
  const toggleExpanded = useEvent(() => setExpandedOverride(!isExpanded))

  // Through the guarded decoder: '0' is the wire's "no price", and a LONG's collateral USD value is
  // amount x mark, so the raw value captioned every amount the user typed as "$0.00" — on a sheet that
  // stays fully submittable, since its ceiling is the server's `maxWithdrawable` and never this read.
  // A SHORT's collateral is the stable leg and needs no mark, which is why it keeps its caption.
  const usableMark = marginPositionMark({ position })
  const direction = position.direction
  // Number('Infinity') is truthy, and formatting a non-finite value throws inside the formatter.
  const amountHuman = Number(amount)
  const amountUsd =
    usableMark === undefined && direction !== 'SHORT'
      ? undefined
      : collateralUsdValue({
          collateralAmount: Number.isFinite(amountHuman) ? amountHuman : 0,
          mark: usableMark ?? 0,
          direction,
        })

  const collateralLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginAssetCurrencyId(market) })?.logoUrl
  const debtLogoUrl = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(market.debt) })?.logoUrl
  const debtLogos = { url: debtLogoUrl ?? undefined, symbol: marginUnwrapSymbol(market.debt) }
  // The Size row reads the EXPOSURE leg — a short's is its debt leg, a long's its collateral.
  const sizeLogos =
    direction === 'SHORT' ? debtLogos : { url: collateralLogoUrl ?? undefined, symbol: market.displaySymbol }
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
        <MarginAmountField
          inputAriaLabel={t('margin.withdraw.amountLabel')}
          value={amount}
          onChangeText={setAmount}
          maxDecimals={collateralDecimals}
          chip={{ kind: 'static', symbol: market.displaySymbol, logoUrl: collateralLogoUrl ?? undefined }}
          usdCaption={
            amountUsd === undefined
              ? undefined
              : formatNumberOrString({ value: amountUsd, type: NumberType.FiatStandard })
          }
          trailing={
            hasCeiling
              ? {
                  kind: 'action',
                  label: t('margin.withdraw.available', {
                    amount: `${formatNumberOrString({
                      value: Number(formatUnits(BigInt(maxWithdrawableRaw), collateralDecimals)),
                      type: NumberType.TokenNonTx,
                    })} ${market.displaySymbol}`,
                  }),
                  ariaLabel: t('margin.withdraw.useMax'),
                  onPress: onFillMax,
                }
              : undefined
          }
          // The server always reserves a dust remainder, so Adjust can never empty the position.
          helperCaption={hasDebt ? undefined : t('margin.withdraw.fullExitHint')}
        />
      )}
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
