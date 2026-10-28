import { Flex, Text } from '@universe/mycelium'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Separator } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import type { MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { MarginMarketSelector } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { MarginOpenButton } from '~/pages/Swap/Margin/components/MarginOpenButton'
import { MarginOpenReviewModal } from '~/pages/Swap/Margin/components/MarginOpenReviewModal'
import { MarginPayWith } from '~/pages/Swap/Margin/components/MarginPayWith'
import { MarginRateRows } from '~/pages/Swap/Margin/components/MarginRateRows'
import { MarginFormSideToggle } from '~/pages/Swap/Margin/components/MarginSideToggle'
import { MarginSizeBlock } from '~/pages/Swap/Margin/components/MarginSizeBlock'
import { type DerivedMarginInfo, useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { conversionCaptionEquity } from '~/pages/Swap/Margin/marginFormat'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'

// legs[0].bounds.increase.expectedEquityDelta (raw collateral units) → display units for the conversion line.
/**
 * The open form's adapter onto `conversionCaptionEquity` — the shared rule for this caption, which the
 * add and adjust sheets read too. Only the formatting is local: this surface renders the figure into a
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
  // The reporting mount for venue-routed telemetry: this is where a venue is actually chosen. Other
  // surfaces mount the same hook to read a derived field and stay silent — see its `reportVenueRouted`.
  const { formatNumberOrString } = useLocalizationContext()
  const derivedMarginInfo = useDerivedMarginInfo({ market, reportVenueRouted: true })
  const marginAmount = useMarginFormStore((s) => s.marginAmount)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const conversionEquity = marginConversionEquity({ info: derivedMarginInfo, formatNumberOrString })
  const openReview = useEvent(() => setIsReviewOpen(true))
  const closeReview = useEvent(() => setIsReviewOpen(false))

  const onSetExactAmount = useEvent((amount: string) => {
    setMarginFormState({ marginAmount: amount })
  })
  const onSetPresetValue = useEvent((amount: string) => {
    setMarginFormState({ marginAmount: amount })
  })
  // Fiat entry mode is not supported for the margin equity input.
  const onToggleIsFiatMode = useEvent(() => {})
  const onShowTokenSelector = useEvent(() => setMarginFormState({ selectingPaymentToken: true }))
  const onSelectPaymentToken = useEvent((paymentToken: MarginPaymentToken | undefined) => {
    setMarginFormState({ paymentToken })
  })

  return (
    <Flex gap="$spacing8">
      <CurrencyInputPanel
        currencyField={CurrencyField.INPUT}
        currencyInfo={derivedMarginInfo.paymentCurrencyInfo}
        currencyAmount={derivedMarginInfo.paymentCurrencyAmount}
        currencyBalance={derivedMarginInfo.balance}
        usdValue={derivedMarginInfo.paymentUsdValue}
        value={marginAmount}
        headerLabel={t('margin.payment.header')}
        onSetExactAmount={onSetExactAmount}
        onSetPresetValue={onSetPresetValue}
        onToggleIsFiatMode={onToggleIsFiatMode}
        onShowTokenSelector={onShowTokenSelector}
      />
      <MarginPayWith derivedMarginInfo={derivedMarginInfo} onSelectPaymentToken={onSelectPaymentToken} />
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
      <MarginSizeBlock derivedMarginInfo={derivedMarginInfo} />
      <MarginRateRows derivedMarginInfo={derivedMarginInfo} />
      <MarginOpenButton derivedMarginInfo={derivedMarginInfo} onRequestReview={openReview} />
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

function MarginFormContent({ showInlinePositions }: { showInlinePositions: boolean }): JSX.Element {
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
      {displayMarket ? <MarginFormSideToggle market={displayMarket} /> : null}
      <MarginMarketSelector />
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
export function MarginForm({ showInlinePositions = true }: { showInlinePositions?: boolean }): JSX.Element {
  return <MarginFormContent showInlinePositions={showInlinePositions} />
}
