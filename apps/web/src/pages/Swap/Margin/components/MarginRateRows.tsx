import { type ColorTokens, Flex, Text, Tooltip } from '@universe/mycelium'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedNumber, { type AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MarginVenueLogo } from '~/features/margin/components/MarginVenueLogo'
import { findMarginTokenInfoInMarkets, useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { formatLiqDistanceSuffix, getMarginHealthStatus, marginVenueLabel } from '~/features/margin/utils/marginFormat'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { MarginMarketRow } from '~/pages/Swap/Margin/components/MarginMarketRow'
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { MarginDepositValue, MarginPaymentSwapValue } from '~/pages/Swap/Margin/components/MarginReceiptDepositValues'
import { useMarginReceiptDetails } from '~/pages/Swap/Margin/components/MarginReceiptEstimate'
import {
  formatSignedPct,
  MarginEntryTooltip,
  MarginLeveragedRateTooltip,
  MarginLiquidationTooltip,
} from '~/pages/Swap/Margin/components/MarginReceiptTooltips'
import { MarginRouteRow } from '~/pages/Swap/Margin/components/MarginRouteRow'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import { type DerivedMarginInfo, quoteRefetchPulseClass } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { buildMarginRouteSteps } from '~/pages/Swap/Margin/marginRouteSteps'

const RECEIPT_ROW_HEIGHT = 32

// Fixed-height receipt row on a 32px grid, so values ticking between widths never shift the rows.
function ReceiptRow({ label, value, tooltip }: { label: string; value: ReactNode; tooltip?: ReactNode }): JSX.Element {
  return (
    <Flex height={RECEIPT_ROW_HEIGHT} justifyContent="center">
      <MarginDetailRow label={label} value={value} tooltip={tooltip} tooltipTrigger="row" />
    </Flex>
  )
}

function SuffixText({ text, color }: { text: string; color: ColorTokens }): JSX.Element {
  return (
    <Text variant="body3" color={color} style={{ whiteSpace: 'pre' }}>
      {` ${text}`}
    </Text>
  )
}

// Rows fade up with a 40ms-per-index stagger when the receipt first mounts. Literal delay classes
// (not interpolated) so Tailwind's scanner keeps them.
const STAGGER_DELAY_CLASSES = [
  '[animation-delay:0ms]',
  '[animation-delay:40ms]',
  '[animation-delay:80ms]',
  '[animation-delay:120ms]',
  '[animation-delay:160ms]',
]

function StaggerIn({ index, children }: { index: number; children: ReactNode }): JSX.Element {
  return (
    <Flex className={`${ENTER_PRESET_CLASSES.fadeInBelow} ${STAGGER_DELAY_CLASSES[index]} [animation-fill-mode:both]`}>
      {children}
    </Flex>
  )
}

// The quote's rate is the routed venue's, so the venue-specific bits below render only with a venue:
// undefined while it is provisional (a bridged quote's).
function BorrowVenueLogo({
  venue,
  borrowApyPct,
}: {
  venue: MarginVenue | undefined
  borrowApyPct: number | undefined
}): JSX.Element | null {
  const { t } = useTranslation()
  if (venue === undefined) {
    return null
  }
  const tooltip =
    borrowApyPct === undefined
      ? marginVenueLabel(venue)
      : t('margin.receipt.borrowRateTooltip', { venue: marginVenueLabel(venue), rate: `${borrowApyPct.toFixed(1)}%` })
  return (
    <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
      <Tooltip.Trigger>
        <Flex alignItems="center" justifyContent="center">
          <MarginVenueLogo venue={venue} size="$icon.16" />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Text variant="body4">{tooltip}</Text>
      </Tooltip.Content>
    </Tooltip>
  )
}

// The explicit color turns off AnimatedNumber's up-is-green flash, which reads backwards on a receipt: a
// higher liquidation price, more borrowing or more gas is not good news.
function ReceiptFigure(props: Omit<AnimatedNumberProps, 'textVariant' | 'color'>): JSX.Element {
  return <AnimatedNumber {...props} textVariant="$body3" color="$neutral1" />
}

// Flat receipt under the CTA: the headline rows always visible, the rest under an arrow-only show-more.
// Rows stagger in when the first quote lands and their values roll as the quote moves.
export function MarginRateRows({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element | null {
  // Above the quote gate: a venue pin blanks the quote for one fetch, and the receipt must not
  // remount collapsed, hiding the row the user just picked from.
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))
  const { quote, hasEnteredAmount } = derivedMarginInfo
  // The receipt mounts once there is something to price, so the rows' CSS enter animation plays
  // exactly when it first appears. Without a quote it shows the estimate.
  if (!quote && !hasEnteredAmount) {
    return null
  }
  return (
    <MarginReceipt
      derivedMarginInfo={derivedMarginInfo}
      quote={quote}
      isExpanded={isExpanded}
      onToggleExpanded={toggleExpanded}
    />
  )
}

// The last settled impact holds while a requote is in flight (the fill is withheld until it settles), so
// the Entry suffix doesn't blink on every keystroke.
function useSettledImpactPct({ impactPct, hasQuote }: { impactPct?: number; hasQuote: boolean }): number | undefined {
  const [settled, setSettled] = useState(impactPct)
  if (impactPct !== undefined && impactPct !== settled) {
    setSettled(impactPct)
  }
  return impactPct ?? (hasQuote ? settled : undefined)
}

function LeveragedRateValue({ ratePct, empty }: { ratePct?: number; empty: JSX.Element }): JSX.Element {
  const { t } = useTranslation()
  if (ratePct === undefined) {
    return empty
  }
  return (
    <Text variant="body3" color="$neutral2">
      {`${t('margin.receipt.leveragedRate.youPay')} `}
      <Text variant="body3" color="$neutral1">{`${ratePct.toFixed(2)}%`}</Text>
    </Text>
  )
}

function MarginReceipt({
  derivedMarginInfo,
  quote,
  isExpanded,
  onToggleExpanded,
}: {
  derivedMarginInfo: DerivedMarginInfo
  quote: MarginQuoteResponse | undefined
  isExpanded: boolean
  onToggleExpanded: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { markets } = useMarginMarkets()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)

  const { market, isPlaceholderData } = derivedMarginInfo
  // useDerivedMarginInfo's placeholderData contract: a bridged quote's venue (and so its rate) is
  // provisional. No fallback to the form's market either — that names a venue the quote never routed to.
  const routedVenue = isPlaceholderData ? undefined : quote?.legs.at(0)?.venue
  const { figures, details, equity, borrowRatePct } = useMarginReceiptDetails({ derivedMarginInfo, routedVenue })
  // What the borrow bought waits for a settled quote: a debounced or bridged one answers an old input.
  const bought = derivedMarginInfo.isDebouncing || isPlaceholderData ? undefined : figures.collateralBought

  const debtSymbol = marginUnwrapSymbol(market.debt)
  const collateralSymbol = marginUnwrapSymbol(market.collateral)
  const fiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatTokenPrice })
  const token = (value: number): string => formatNumberOrString({ value, type: NumberType.TokenTx })
  const empty = (
    <Text variant="body3" color="$neutral3">
      —
    </Text>
  )

  // The tooltip's Price impact line, net of the fee it lists beside it, so the two never disagree.
  const impactPct = useSettledImpactPct({ impactPct: details.entry.impactPct, hasQuote: quote !== undefined })
  const entryImpactSuffix =
    impactPct === undefined ? undefined : <SuffixText text={`(${formatSignedPct(impactPct)})`} color="$neutral2" />
  const entryValue =
    figures.entryPrice === undefined ? (
      empty
    ) : (
      <ReceiptFigure
        value={fiat(figures.entryPrice)}
        numericValue={figures.entryPrice}
        EndElement={entryImpactSuffix}
        endElementGap={0}
      />
    )

  const healthColor =
    figures.healthFactor === undefined
      ? '$neutral1'
      : (getMarginHealthStatus(figures.healthFactor).color as ColorTokens)
  // A bridged quote was priced on a market the open may have left, so its liquidation price is withheld too.
  const liqValue =
    isPlaceholderData || figures.liquidationPrice === undefined ? (
      empty
    ) : (
      <ReceiptFigure
        value={fiat(figures.liquidationPrice)}
        numericValue={figures.liquidationPrice}
        EndElement={
          figures.liqDistancePct === undefined ? undefined : (
            <SuffixText text={formatLiqDistanceSuffix(figures.liqDistancePct)} color={healthColor} />
          )
        }
        endElementGap={0}
      />
    )
  const borrowingValue =
    figures.borrowing === undefined ? (
      empty
    ) : (
      <Flex row alignItems="center" gap="$spacing6">
        <BorrowVenueLogo venue={routedVenue} borrowApyPct={figures.borrowApyPct} />
        {/* Folds in the leverage swap: "1,200 USDC → 0.49 ETH". */}
        <ReceiptFigure
          value={`${token(figures.borrowing)} ${debtSymbol}${bought === undefined ? '' : ` → ${token(bought)} ${collateralSymbol}`}`}
          numericValue={bought === undefined ? figures.borrowing : undefined}
        />
      </Flex>
    )

  const breakEvenValue =
    figures.breakEvenPrice === undefined ? (
      empty
    ) : (
      <ReceiptFigure value={fiat(figures.breakEvenPrice)} numericValue={figures.breakEvenPrice} />
    )

  const gasDisplay =
    figures.gasUsd !== undefined
      ? formatNumberOrString({ value: figures.gasUsd, type: NumberType.FiatGasPrice })
      : figures.gasEth !== undefined
        ? `${figures.gasEth.toFixed(5)} ETH`
        : undefined

  // Slippage applies per leg; with a pre-swap the effective total compounds: (1+s)² − 1 ≈ 2s.
  const slippageFraction = slippageToleranceBps / 10_000
  const slippagePercentDisplay = quote?.paymentSwap
    ? `${(((1 + slippageFraction) ** 2 - 1) * 100).toFixed(2)}%`
    : `${(slippageFraction * 100).toFixed(2)}%`

  const routeSteps = !quote
    ? []
    : buildMarginRouteSteps({
        quote,
        market,
        paymentTokenSymbol: derivedMarginInfo.paymentToken.symbol,
        resolveSymbol: (address) => {
          const info = findMarginTokenInfoInMarkets({ markets, address })
          return info ? marginUnwrapSymbol(info) : undefined
        },
      })

  return (
    <Flex px="$spacing8" testID={TestID.MarginReceipt} className={quoteRefetchPulseClass(derivedMarginInfo)}>
      <StaggerIn index={0}>
        <MarginMarketRow routedVenue={routedVenue} quotedRatePct={figures.borrowApyPct} />
      </StaggerIn>
      <StaggerIn index={0}>
        <ReceiptRow
          label={t('margin.receipt.margin')}
          tooltip={t('margin.receipt.marginTooltip')}
          value={
            <MarginDepositValue
              derivedMarginInfo={derivedMarginInfo}
              mark={figures.oraclePrice ?? figures.entryPrice}
            />
          }
        />
      </StaggerIn>
      {derivedMarginInfo.isPaymentDifferentFromCollateral ? (
        <StaggerIn index={0}>
          <ReceiptRow
            label={t('margin.receipt.swapping')}
            tooltip={t('margin.receipt.swappingTooltip')}
            value={<MarginPaymentSwapValue derivedMarginInfo={derivedMarginInfo} equity={equity} />}
          />
        </StaggerIn>
      ) : null}
      <StaggerIn index={0}>
        <ReceiptRow
          label={t('margin.fees.entryPrice')}
          tooltip={<MarginEntryTooltip entry={details.entry} />}
          value={entryValue}
        />
      </StaggerIn>
      <StaggerIn index={1}>
        <ReceiptRow
          label={t('margin.receipt.liquidationPrice')}
          tooltip={<MarginLiquidationTooltip liquidation={details.liquidation} collateralSymbol={collateralSymbol} />}
          value={liqValue}
        />
      </StaggerIn>
      <StaggerIn index={2}>
        <ReceiptRow
          label={t('margin.receipt.leveragedRate.label')}
          tooltip={
            <MarginLeveragedRateTooltip
              ratePct={details.leveragedRatePct}
              borrowRatePct={borrowRatePct}
              leverage={derivedMarginInfo.leverage}
              debtSymbol={debtSymbol}
              collateralSymbol={collateralSymbol}
            />
          }
          value={<LeveragedRateValue ratePct={details.leveragedRatePct} empty={empty} />}
        />
      </StaggerIn>
      <StaggerIn index={2}>
        <ReceiptRow label={t('margin.size.borrowing')} value={borrowingValue} />
      </StaggerIn>
      <StaggerIn index={3}>
        {quote ? (
          <Flex py="$spacing4">
            <MarginShowMoreToggle isExpanded={isExpanded} onToggle={onToggleExpanded} hideLabel />
          </Flex>
        ) : (
          <Text variant="body4" color="$neutral3" pt="$spacing4">
            {t('margin.receipt.estimated')}
          </Text>
        )}
      </StaggerIn>
      <HeightAnimator open={isExpanded && quote !== undefined}>
        <Flex pb="$spacing2">
          <ReceiptRow
            label={t('margin.receipt.breakEven')}
            tooltip={t('margin.receipt.breakEvenTooltip')}
            value={breakEvenValue}
          />
          <MarginPriceImpactRow impactBps={figures.priceImpactBps} markIsStale={false} />
          <Flex minHeight={RECEIPT_ROW_HEIGHT} justifyContent="center">
            <MarginRouteRow steps={routeSteps} />
          </Flex>
          <ReceiptRow
            label={t('margin.fees.maxSlippage')}
            tooltip={quote?.paymentSwap ? t('margin.fees.slippageCompoundedTooltip') : undefined}
            value={slippagePercentDisplay}
          />
          <ReceiptRow
            label={t('margin.fees.networkCost')}
            value={
              gasDisplay === undefined ? (
                empty
              ) : (
                <ReceiptFigure value={gasDisplay} numericValue={figures.gasUsd ?? figures.gasEth} />
              )
            }
          />
        </Flex>
      </HeightAnimator>
    </Flex>
  )
}
