import { Button, Flex, Text, Separator } from '@universe/mycelium'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { useAccount } from '~/connection/hooks/useAccount'
import type { MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { conversionCaptionEquity } from '~/features/margin/utils/marginFormat'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { MarginLeverageSection } from '~/pages/Swap/Margin/components/MarginLeverageSection'
import { MarginMarketSelector } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { MarginOpenButton } from '~/pages/Swap/Margin/components/MarginOpenButton'
import { MarginOpenReviewModal } from '~/pages/Swap/Margin/components/MarginOpenReviewModal'
import { MarginPayWith } from '~/pages/Swap/Margin/components/MarginPayWith'
import { MarginRateRows } from '~/pages/Swap/Margin/components/MarginRateRows'
import { type DerivedMarginInfo, useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useMarginEquityInput } from '~/pages/Swap/Margin/hooks/useMarginEquityInput'
import { useClearMarginVenuePinOnQuoteError } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'

// legs[0].bounds.increase.expectedEquityDelta (raw collateral units) → display units for the conversion line.
/**
 * The open form's adapter onto `conversionCaptionEquity` — the shared rule for this caption, which the
 * add sheet reads too. Only the formatting is local: this surface renders the figure into a
 * translated sentence beside app-formatted numbers, so it takes the app locale rather than the
 * browser's.
 */
export function marginConversionEquity({
  info,
  formatNumberOrString,
}: {
  info: Pick<
    DerivedMarginInfo,
    'isPaymentDifferentFromCollateral' | 'isDebouncing' | 'isPlaceholderData' | 'quote' | 'market'
  >
  // The app's shared formatter, not a raw toLocaleString: at `maximumFractionDigits: 6` a dust equity
  // (4e-7 WETH) rounds to "0" and the caption reads "≈0 ETH margin" — reintroducing, at the formatting
  // step, the exact "≈ 0 reads as the answer" failure the guard below exists to close. TokenTx renders
  // "<0.00001" instead, and it carries the app locale, so this drops the second locale source.
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
}): string | undefined {
  const equity = conversionCaptionEquity({
    equityInRaw: info.quote?.legs[0]?.bounds.increase?.expectedEquityDelta,
    decimals: info.market.collateral.decimals,
    isPaymentTokenCollateral: !info.isPaymentDifferentFromCollateral,
    isQuoteStale: info.isDebouncing || info.isPlaceholderData,
  })
  return equity === undefined ? undefined : formatNumberOrString({ value: equity, type: NumberType.TokenTx })
}

// The market-dependent half of the form: everything below CurrencyInputPanel needs a resolved
// market, so it only mounts once MarginFormContent's gate confirms one. Every hook here must stay
// unconditional within this component — the gate itself lives one level up.
function MarginFormBody({ market }: { market: MarginMarket }): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  // The reporting mount for venue-routed telemetry: this is where a venue is actually chosen. Other
  // surfaces mount the same hook to read a derived field and stay silent — see its `reportVenueRouted`.
  const derivedMarginInfo = useDerivedMarginInfo({ market, reportVenueRouted: true })
  useClearMarginVenuePinOnQuoteError({
    market,
    quoteError: derivedMarginInfo.quoteError,
    hasQuote: derivedMarginInfo.quote !== undefined,
  })
  const marginAmount = useMarginFormStore((s) => s.marginAmount)
  const equityInput = useMarginEquityInput({ derivedMarginInfo })
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const conversionEquity = marginConversionEquity({ info: derivedMarginInfo, formatNumberOrString })
  const openReview = useEvent(() => setIsReviewOpen(true))
  const closeReview = useEvent(() => setIsReviewOpen(false))

  // Fiat entry mode is not supported for the margin equity input.
  const onToggleIsFiatMode = useEvent(() => {})

  return (
    <Flex gap="$spacing8">
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" overflow="hidden">
        <CurrencyInputPanel
          currencyField={CurrencyField.INPUT}
          currencyInfo={equityInput.equityCurrencyInfo}
          currencyAmount={equityInput.currencyAmount}
          currencyBalance={equityInput.balance}
          // The balance is already spendable: gas is reserved from a native pay balance before it is
          // restated, and a collateral figure restated from another token has none to reserve.
          isGasCovered
          // Same dollars either way: the pay amount is the margin restated in the pay token.
          usdValue={derivedMarginInfo.paymentUsdValue}
          value={equityInput.value}
          headerLabel={t('margin.payment.header')}
          onSetExactAmount={equityInput.onSetExactAmount}
          onSetPresetValue={equityInput.onSetPresetValue}
          onToggleIsFiatMode={onToggleIsFiatMode}
        />
        <Separator />
        <MarginLeverageSection derivedMarginInfo={derivedMarginInfo} />
      </Flex>
      <MarginPayWith derivedMarginInfo={derivedMarginInfo} onSelectPaymentToken={equityInput.selectPaymentToken} />
      {conversionEquity !== undefined ? (
        <Text variant="body4" color="$neutral2" px="$spacing16">
          {t('margin.payment.conversion', {
            paymentAmount: marginAmount,
            paymentSymbol: derivedMarginInfo.paymentToken.symbol,
            equity: conversionEquity,
            collateralSymbol: derivedMarginInfo.market.displaySymbol,
          })}
        </Text>
      ) : null}
      <MarginOpenButton derivedMarginInfo={derivedMarginInfo} onRequestReview={openReview} />
      {/* The receipt sits under the CTA: the figures the button commits to, read after deciding. */}
      <MarginRateRows derivedMarginInfo={derivedMarginInfo} />
      <MarginOpenReviewModal derivedMarginInfo={derivedMarginInfo} isOpen={isReviewOpen} onClose={closeReview} />
      <Separator mt="$spacing8" />
      <Text variant="body4" color="$neutral3">
        {t('margin.disclaimer')}
      </Text>
    </Flex>
  )
}

/** Its own component because the age ticks every second, which must not re-render the form. */
function MarketsStaleCaption({ dataUpdatedAt }: { dataUpdatedAt: number }): JSX.Element {
  const { t } = useTranslation()
  const staleTimeAgo = useAbbreviatedTimeString(dataUpdatedAt)
  return (
    <Text variant="body4" color="$neutral2">
      {t('margin.market.stale', { time: staleTimeAgo })}
    </Text>
  )
}

function MarginFormContent({
  showInlinePositions,
  showMarketSelector,
  marketSelectorTrailing,
  marketSelectorFooter,
}: {
  showInlinePositions: boolean
  showMarketSelector: boolean
  marketSelectorTrailing?: ReactNode
  marketSelectorFooter?: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { setMarginFormState } = useMarginFormStoreActions()
  const { groups, markets, getPairMarket, isLoading, isFetching, error, refetch, dataUpdatedAt } = useMarginMarkets()
  const market = getPairMarket(pairKey)
  // Render decision only — a populated registry with a momentarily-stale stored key still shows the
  // first available market instead of flashing "No markets available" for one frame while the adopt
  // effect below catches up. The effect itself stays keyed on the un-fallen-back `market` so it still
  // fires for that exact case.
  const displayMarket = market ?? markets.at(0)

  // Adopts the first available pair group once the registry resolves, replacing a stored key that no
  // longer matches any pair (server markets can change). Writes `side` alongside `pairKey` —
  // landing on a short market otherwise leaves the toggle reading "Long" — and no-ops when there is
  // no group, which avoids a spurious `paymentToken: undefined` reset when there's nothing to adopt.
  // Groups are what the selector lists, and they carry both fields resolved, so adopting one can't
  // land on a pair the selector wouldn't show.
  const adoptFirstMarket = useEvent(() => {
    const first = groups.at(0)
    if (first) {
      setMarginFormState({
        pairKey: first.pairKey,
        paymentToken: undefined,
        side: first.direction,
      })
    }
  })
  useEffect(() => {
    if (!isLoading && !market) {
      adoptFirstMarket()
    }
  }, [isLoading, market, adoptFirstMarket])

  return (
    <Flex gap="$spacing8">
      {showMarketSelector ? <MarginMarketSelector trailing={marketSelectorTrailing} /> : null}
      {showMarketSelector ? marketSelectorFooter : null}
      {displayMarket ? (
        <>
          {/* Keyed on pair identity, not market.key: the review sheet's open state and pinned quote
              are local to this subtree, and an adopt that changes the pair must not leave them alive
              against a market the user never chose. Venue is deliberately excluded — a venue that
              sorts first would otherwise remount a pair that did not change. */}
          <MarginFormBody
            key={marginPairKey({
              collateralToken: displayMarket.collateral.address,
              debtToken: displayMarket.debt.address,
            })}
            market={displayMarket}
          />
          {error ? (
            // A mid-session refetch failure keeps showing the last-known-good market list (React
            // Query retains its cached data), so this is a caption + retry alongside the still-live
            // form, never a replacement for it.
            <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
              <MarketsStaleCaption dataUpdatedAt={dataUpdatedAt} />
              <Button size="small" variant="branded" emphasis="secondary" onPress={refetch}>
                {t('common.button.retry')}
              </Button>
            </Flex>
          ) : null}
        </>
      ) : (
        <>
          {!account.address ? (
            // The only actionable control for a disconnected visitor while markets are still
            // resolving — MarginOpenButton's own connect CTA lives inside MarginFormBody, which only
            // mounts once a market resolves, so it can't stand in for this window. Rendered
            // alongside (not instead of) the markets state below, so a disconnected visitor during a
            // markets failure still sees the error copy and retry, not just the connect prompt.
            <Flex row>
              <Button variant="branded" size="large" fill onPress={accountDrawer.open}>
                {t('common.connectWallet.button')}
              </Button>
            </Flex>
          ) : null}
          <MarginFormMarketsState isLoading={isLoading || isFetching} error={error} onRetry={refetch} />
        </>
      )}
      {showInlinePositions && <MarginPositionsTable />}
    </Flex>
  )
}

// Store provider is hoisted in Swap() (pages/Swap/index.tsx) so form state survives
// the terminal morph and the 1024px breakpoint switch.
export function MarginForm({
  showInlinePositions = true,
  // Off in the terminal layout, where the chart header's pair title is the market picker. Below
  // 1024px there is no chart pane, so the form's own card is the only way to pick a market.
  showMarketSelector = true,
  marketSelectorTrailing,
  marketSelectorFooter,
}: {
  showInlinePositions?: boolean
  showMarketSelector?: boolean
  // Beside the market card, e.g. the mobile layout's "View chart" button.
  marketSelectorTrailing?: ReactNode
  // Under the market card, e.g. the mobile layout's market stats.
  marketSelectorFooter?: ReactNode
}): JSX.Element {
  return (
    <MarginFormContent
      showInlinePositions={showInlinePositions}
      showMarketSelector={showMarketSelector}
      marketSelectorTrailing={marketSelectorTrailing}
      marketSelectorFooter={marketSelectorFooter}
    />
  )
}
