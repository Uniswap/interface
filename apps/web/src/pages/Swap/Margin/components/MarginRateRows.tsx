import { type ColorTokens, Flex, Text, Tooltip, TouchableArea } from '@universe/mycelium'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { Settings } from '@universe/mycelium/icons/Settings'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from 'ui/src'
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
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { MarginRouteRow } from '~/pages/Swap/Margin/components/MarginRouteRow'
import { MarginSizeReceiptValue } from '~/pages/Swap/Margin/components/MarginSizeBlock'
import { MarginSlippageControl } from '~/pages/Swap/Margin/components/MarginSlippageControl'
import { MarginVenuePickerButton } from '~/pages/Swap/Margin/components/MarginVenuePickerButton'
import {
  MarginVenuePreferencesModal,
  MarginVenueSettingsRow,
  useActiveMarginPairGroup,
} from '~/pages/Swap/Margin/components/MarginVenuePreferences'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { deriveMarginReceiptFigures } from '~/pages/Swap/Margin/marginReceiptFigures'
import { buildMarginRouteSteps } from '~/pages/Swap/Margin/marginRouteSteps'

// Tab-row ⚙︎ for the Margin tab: a small margin-scoped popover (NOT the swap-wide settings UI). Also
// the venue opt-out sheet's second entry point — the first is the market picker's per-pair cell.
export function MarginSettingsPopover(): JSX.Element {
  const { t } = useTranslation()
  const group = useActiveMarginPairGroup()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isVenuesOpen, setIsVenuesOpen] = useState(false)

  // Closes the panel on the way out: the popover would otherwise sit behind the modal it launched.
  const openVenues = useEvent(() => {
    setIsPopoverOpen(false)
    setIsVenuesOpen(true)
  })
  const closeVenues = useEvent(() => setIsVenuesOpen(false))

  return (
    <>
      <Popover placement="bottom-end" stayInFrame allowFlip open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Trigger cursor="pointer">
          <Flex p="$spacing4" borderRadius="$roundedFull" hoverStyle={{ backgroundColor: '$surface2' }}>
            <Settings size="$icon.20" color="$neutral2" />
          </Flex>
        </Popover.Trigger>
        <Popover.Content
          backgroundColor="$surface1"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded16"
          p="$spacing12"
          elevate
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
        >
          <Flex gap="$spacing12" minWidth={280}>
            {group ? <MarginVenueSettingsRow group={group} onPress={openVenues} /> : null}
            <Flex gap="$spacing8">
              <Text variant="body3" color="$neutral2">
                {t('margin.fees.maxSlippage')}
              </Text>
              <MarginSlippageControl />
            </Flex>
          </Flex>
        </Popover.Content>
      </Popover>
      {/* Outside the popover, whose content unmounts on the very close that opens this. */}
      {isVenuesOpen && group ? <MarginVenuePreferencesModal group={group} isOpen onClose={closeVenues} /> : null}
    </>
  )
}

const RECEIPT_ROW_HEIGHT = 32

// Fixed-height receipt row on a 32px grid, so values ticking between widths never shift the rows.
function ReceiptRow({ label, value, tooltip }: { label: string; value: ReactNode; tooltip?: ReactNode }): JSX.Element {
  return (
    <Flex height={RECEIPT_ROW_HEIGHT} justifyContent="center">
      <MarginDetailRow label={label} value={value} tooltip={tooltip} />
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

// Where the position borrows, at what rate, and what that costs per day.
function MarketValue({
  venue,
  borrowApyPct,
  borrowPerDayUsd,
}: {
  venue: MarginVenue | undefined
  borrowApyPct: number | undefined
  borrowPerDayUsd: number | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  if (venue === undefined) {
    return (
      <Text variant="body3" color="$neutral1">
        {t('margin.route.autoBest')}
      </Text>
    )
  }
  return (
    <Flex row alignItems="center" gap="$spacing6">
      <MarginVenueLogo venue={venue} size="$icon.16" />
      <Text variant="body3" color="$neutral1">
        {marginVenueLabel(venue)}
      </Text>
      {borrowApyPct === undefined ? null : (
        <Text variant="body3" color="$neutral1">
          {borrowApyPct.toFixed(1)}%
        </Text>
      )}
      {borrowPerDayUsd === undefined ? null : (
        <AnimatedNumber
          value={t('margin.receipt.perDay', {
            amount: formatNumberOrString({ value: borrowPerDayUsd, type: NumberType.FiatTokenPrice }),
          })}
          numericValue={borrowPerDayUsd}
          textVariant="$body3"
          color="$neutral2"
        />
      )}
    </Flex>
  )
}

// The explicit color turns off AnimatedNumber's up-is-green flash, which reads backwards on a receipt: a
// higher liquidation price, more borrowing or more gas is not good news.
function ReceiptFigure(props: Omit<AnimatedNumberProps, 'textVariant' | 'color'>): JSX.Element {
  return <AnimatedNumber {...props} textVariant="$body3" color="$neutral1" />
}

// Flat receipt under the CTA: Entry price, Liquidation price and Borrowing always visible, then an
// arrow-only show-more with Swapping, Market, Break-even, price impact, Route, Max slippage and Network
// cost. Rows stagger in when the first quote lands and their values roll as the quote moves.
export function MarginRateRows({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element | null {
  // Above the quote gate: a venue pin blanks the quote for one fetch, and the receipt must not
  // remount collapsed, hiding the row the user just picked from.
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpanded = useEvent(() => setIsExpanded((prev) => !prev))
  const { quote } = derivedMarginInfo
  // The receipt mounts only once there is a quote to price, so the rows' CSS enter animation plays
  // exactly when it first appears.
  if (!quote) {
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

function MarginReceipt({
  derivedMarginInfo,
  quote,
  isExpanded,
  onToggleExpanded,
}: {
  derivedMarginInfo: DerivedMarginInfo
  quote: MarginQuoteResponse
  isExpanded: boolean
  onToggleExpanded: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { markets } = useMarginMarkets()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)
  const [isSlippageOpen, setIsSlippageOpen] = useState(false)

  const toggleSlippage = useEvent(() => setIsSlippageOpen((prev) => !prev))

  const { market, direction, isPlaceholderData } = derivedMarginInfo
  // useDerivedMarginInfo's placeholderData contract: a bridged quote's venue (and so its rate) is
  // provisional. No fallback to the form's market either — that names a venue the quote never routed to.
  const routedVenue = isPlaceholderData ? undefined : quote.legs.at(0)?.venue
  const figures = deriveMarginReceiptFigures({ quote, market, direction })

  const debtSymbol = marginUnwrapSymbol(market.debt)
  const collateralSymbol = marginUnwrapSymbol(market.collateral)
  const fiat = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatTokenPrice })
  const token = (value: number): string => formatNumberOrString({ value, type: NumberType.TokenTx })
  const empty = (
    <Text variant="body3" color="$neutral3">
      —
    </Text>
  )

  const entryImpactSuffix =
    figures.entryImpactPct === undefined ? undefined : (
      <SuffixText text={formatLiqDistanceSuffix(figures.entryImpactPct)} color="$neutral2" />
    )
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
  const liqTooltip = (
    <Flex gap="$spacing2" maxWidth={240}>
      {figures.oraclePrice === undefined ? null : (
        <Text variant="body4" color="$neutral1">
          {t('margin.receipt.oraclePrice', { price: fiat(figures.oraclePrice) })}
        </Text>
      )}
      <Text variant="body4" color="$neutral2">
        {t('margin.receipt.liquidationPriceTooltip')}
      </Text>
    </Flex>
  )

  const borrowingValue =
    figures.borrowing === undefined ? (
      empty
    ) : (
      <Flex row alignItems="center" gap="$spacing6">
        <BorrowVenueLogo venue={routedVenue} borrowApyPct={figures.borrowApyPct} />
        <ReceiptFigure value={`${token(figures.borrowing)} ${debtSymbol}`} numericValue={figures.borrowing} />
      </Flex>
    )

  const swappingValue =
    figures.borrowing === undefined || figures.collateralBought === undefined ? (
      empty
    ) : (
      <ReceiptFigure
        value={`${token(figures.borrowing)} ${debtSymbol} → ${token(figures.collateralBought)} ${collateralSymbol}`}
      />
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
  const slippagePercentDisplay = quote.paymentSwap
    ? `${(((1 + slippageFraction) ** 2 - 1) * 100).toFixed(2)}%`
    : `${(slippageFraction * 100).toFixed(2)}%`

  const routeSteps = buildMarginRouteSteps({
    quote,
    market,
    paymentTokenSymbol: derivedMarginInfo.paymentToken.symbol,
    resolveSymbol: (address) => {
      const info = findMarginTokenInfoInMarkets({ markets, address })
      return info ? marginUnwrapSymbol(info) : undefined
    },
  })

  const slippageValue = (
    <TouchableArea onPress={toggleSlippage}>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="body3" color="$neutral1">
          {slippagePercentDisplay}
        </Text>
        <RotatableChevron direction={isSlippageOpen ? 'up' : 'down'} size="$icon.16" color="$neutral3" />
      </Flex>
    </TouchableArea>
  )

  return (
    <Flex px="$spacing8" testID={TestID.MarginReceipt}>
      <StaggerIn index={0}>
        <ReceiptRow
          label={t('margin.size.label')}
          value={<MarginSizeReceiptValue derivedMarginInfo={derivedMarginInfo} />}
        />
      </StaggerIn>
      <StaggerIn index={1}>
        <ReceiptRow label={t('margin.fees.entryPrice')} value={entryValue} />
      </StaggerIn>
      <StaggerIn index={2}>
        <ReceiptRow label={t('margin.receipt.liquidationPrice')} tooltip={liqTooltip} value={liqValue} />
      </StaggerIn>
      <StaggerIn index={3}>
        <ReceiptRow label={t('margin.size.borrowing')} value={borrowingValue} />
      </StaggerIn>
      <StaggerIn index={4}>
        <Flex py="$spacing4">
          <MarginShowMoreToggle isExpanded={isExpanded} onToggle={onToggleExpanded} hideLabel />
        </Flex>
      </StaggerIn>
      <HeightAnimator open={isExpanded}>
        <Flex pb="$spacing2">
          <ReceiptRow label={t('margin.receipt.swapping')} value={swappingValue} />
          <ReceiptRow
            label={t('margin.receipt.market')}
            tooltip={t('margin.receipt.marketTooltip')}
            value={
              <Flex row alignItems="center" gap="$spacing6">
                <MarketValue
                  venue={routedVenue}
                  borrowApyPct={figures.borrowApyPct}
                  borrowPerDayUsd={figures.borrowPerDayUsd}
                />
                <MarginVenuePickerButton />
              </Flex>
            }
          />
          <ReceiptRow
            label={t('margin.receipt.breakEven')}
            tooltip={t('margin.receipt.breakEvenTooltip')}
            value={breakEvenValue}
          />
          <MarginPriceImpactRow impactBps={figures.priceImpactBps} markIsStale={false} />
          <Flex minHeight={RECEIPT_ROW_HEIGHT} justifyContent="center">
            <MarginRouteRow steps={routeSteps} />
          </Flex>
          {/* Single no-gap child: a collapsed HeightAnimator sibling would add phantom height between the
              slippage and network-cost rows. */}
          <Flex>
            <Flex height={RECEIPT_ROW_HEIGHT} row justifyContent="space-between" alignItems="center" gap="$spacing12">
              <Text variant="body3" color="$neutral2">
                {t('margin.fees.maxSlippage')}
              </Text>
              {quote.paymentSwap ? (
                <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
                  <Tooltip.Content>
                    <Tooltip.Arrow />
                    <Text variant="body4">{t('margin.fees.slippageCompoundedTooltip')}</Text>
                  </Tooltip.Content>
                  <Tooltip.Trigger>{slippageValue}</Tooltip.Trigger>
                </Tooltip>
              ) : (
                slippageValue
              )}
            </Flex>
            <HeightAnimator open={isSlippageOpen}>
              <Flex pt="$spacing4" pb="$spacing8">
                <MarginSlippageControl />
              </Flex>
            </HeightAnimator>
          </Flex>
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
