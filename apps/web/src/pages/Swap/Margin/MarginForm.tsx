import { Button, Flex, Text, Separator } from '@universe/mycelium'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { useAccount } from '~/connection/hooks/useAccount'
import type { MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { MarginFiatPresets } from '~/pages/Swap/Margin/components/MarginFiatPresets'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { MarginFormSideToggle } from '~/pages/Swap/Margin/components/MarginFormSideToggle'
import { MarginMarketSelector } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { MarginOpenButton } from '~/pages/Swap/Margin/components/MarginOpenButton'
import { MarginOpenReviewModal } from '~/pages/Swap/Margin/components/MarginOpenReviewModal'
import { MarginPayWith } from '~/pages/Swap/Margin/components/MarginPayWith'
import { MarginRateRows } from '~/pages/Swap/Margin/components/MarginRateRows'
import { MarginSizeBlock } from '~/pages/Swap/Margin/components/MarginSizeBlock'
import { MarginLeverageSection } from '~/pages/Swap/Margin/components/MarginSizeLeverageBox'
import { useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useMarginEquityInput } from '~/pages/Swap/Margin/hooks/useMarginEquityInput'
import { useClearMarginVenuePinOnQuoteError } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'
import { MARGIN_INPUT_FONT_SIZES } from '~/pages/Swap/Margin/marginFormConstants'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'

// The market-dependent half of the form: everything below CurrencyInputPanel needs a resolved
// market, so it only mounts once MarginFormContent's gate confirms one. Every hook here must stay
// unconditional within this component — the gate itself lives one level up.
function MarginFormBody({ market }: { market: MarginMarket }): JSX.Element {
  const { t } = useTranslation()
  // The reporting mount for venue-routed telemetry: this is where a venue is actually chosen. Other
  // surfaces mount the same hook to read a derived field and stay silent — see its `reportVenueRouted`.
  const derivedMarginInfo = useDerivedMarginInfo({ market, reportVenueRouted: true })
  useClearMarginVenuePinOnQuoteError({
    market,
    quoteError: derivedMarginInfo.quoteError,
    hasQuote: derivedMarginInfo.quote !== undefined,
  })
  const equityInput = useMarginEquityInput({ derivedMarginInfo })
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const openReview = useEvent(() => setIsReviewOpen(true))
  const closeReview = useEvent(() => setIsReviewOpen(false))
  const onSelectMax = useEvent(() => equityInput.onSetPresetValue('', 'max'))

  return (
    <Flex gap="$spacing8">
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" overflow="hidden">
        <CurrencyInputPanel
          currencyField={CurrencyField.INPUT}
          currencyInfo={equityInput.equityCurrencyInfo}
          currencyAmount={equityInput.currencyAmount}
          // No balance line: Pay with states the pay token's balance in its own units.
          currencyBalance={undefined}
          hideBalance
          showFiatToggleIcon
          // Same dollars either way: the pay amount is the margin restated in the pay token.
          usdValue={derivedMarginInfo.paymentUsdValue}
          value={equityInput.value}
          isFiatMode={equityInput.isFiatMode}
          headerLabel={t('margin.payment.header')}
          fontSizeOptions={MARGIN_INPUT_FONT_SIZES}
          headerAccessory={
            <MarginFiatPresets
              canEnterFiat={equityInput.canEnterFiat}
              canMax={equityInput.canMax}
              onSelectFiat={equityInput.onSetFiatPreset}
              onSelectMax={onSelectMax}
            />
          }
          onSetExactAmount={equityInput.onSetExactAmount}
          onSetPresetValue={equityInput.onSetPresetValue}
          onToggleIsFiatMode={equityInput.onToggleIsFiatMode}
        />
        <Separator />
        <MarginLeverageSection derivedMarginInfo={derivedMarginInfo} />
      </Flex>
      <MarginSizeBlock derivedMarginInfo={derivedMarginInfo} />
      <MarginPayWith derivedMarginInfo={derivedMarginInfo} onSelectPaymentToken={equityInput.selectPaymentToken} />
      <MarginOpenButton derivedMarginInfo={derivedMarginInfo} onRequestReview={openReview} />
      {/* The receipt sits under the CTA: the figures the button commits to, read after deciding. */}
      <MarginRateRows derivedMarginInfo={derivedMarginInfo} />
      <MarginOpenReviewModal derivedMarginInfo={derivedMarginInfo} isOpen={isReviewOpen} onClose={closeReview} />
      <Text variant="body4" color="$neutral3" mt="$spacing8">
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
      {displayMarket ? <MarginFormSideToggle market={displayMarket} /> : null}
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
