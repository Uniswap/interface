import { Flex, Separator, Text, TouchableArea } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from 'ui/src'
import { PresetPill } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetPill'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { create } from 'zustand'
import type { MarginPair } from '~/constants/margin'
import { MarginVenueLogo } from '~/features/margin/components/MarginVenueLogo'
import {
  formatBorrowRate,
  formatMarginDebtUnits,
  formatMaxLeverage,
  marginVenueLabel,
} from '~/features/margin/utils/marginFormat'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { HeaderCell } from '~/pages/Swap/Margin/components/MarginMarketSelectorCells'
import { useActiveMarginPairGroup } from '~/pages/Swap/Margin/components/MarginVenuePreferences'

type PickMode = 'auto' | 'lowestRate' | 'highestLeverage' | 'highestLiquidity' | 'manual'
const CHIPS = ['auto', 'lowestRate', 'highestLeverage', 'highestLiquidity'] as const
// Higher wins. Raw debt units run past 2^53; as a Number they still order correctly.
const SCORES: Record<(typeof CHIPS)[number], (pair: MarginPair) => number | undefined> = {
  auto: () => undefined,
  lowestRate: (pair) => (pair.borrowRateBps === undefined ? undefined : -pair.borrowRateBps),
  highestLeverage: (pair) => pair.maxLeverage,
  highestLiquidity: (pair) =>
    pair.availableBorrowLiquidity === undefined ? undefined : Number(pair.availableBorrowLiquidity),
}
const COLUMN_WIDTHS = { leverage: 72, rate: 72, liquidity: 108 }

// The venue that wins a chip's ranking; undefined for Auto (the server routes) or when none has the figure.
// A venue with nothing left to borrow never wins, however low its rate.
export function bestMarginPair(pairs: MarginPair[], chip: (typeof CHIPS)[number]): MarginPair | undefined {
  const score = (pair: MarginPair): number =>
    pair.availableBorrowLiquidity === '0' ? Number.NEGATIVE_INFINITY : (SCORES[chip](pair) ?? Number.NEGATIVE_INFINITY)
  return [...pairs].sort((a, b) => score(b) - score(a)).find((pair) => Number.isFinite(score(pair)))
}

// Why the pinned venue was chosen. Display state over the form store's pin, which is what the quote reads.
const usePickMode = create<{ mode: PickMode }>()(() => ({ mode: 'auto' }))

/**
 * The receipt's Market row: Market [Auto ⌄] …… Aave v3 · 4.49%. The badge says how the venue was chosen
 * (Auto, the ranking chip that picked it, or Manual); it or the venue's name opens a table comparing the
 * pair's venues, headed by the ranking chips. A pick pins the venue; Auto opens on the server's headline market.
 */
export function MarginMarketRow({
  routedVenue,
  quotedRatePct,
}: {
  // The quote's venue, undefined while it is provisional; the form's market stands in.
  routedVenue: MarginVenue | undefined
  quotedRatePct: number | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const shadowProps = useShadowPropsMedium()
  const [isOpen, setIsOpen] = useState(false)
  const group = useActiveMarginPairGroup()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const pin = useMarginFormStore((s) => s.pinnedVenue)
  const { setMarginFormState } = useMarginFormStoreActions()
  const storedMode = usePickMode((s) => s.mode)

  const pairs = group?.pairs.filter((pair) => !excludedVenues.includes(pair.venue)) ?? []
  // Same rule as useMarginVenueAllowlist: a pin counts only on its own pair, for an allowed venue.
  const pinnedVenue =
    group && pin?.pairKey === group.pairKey && pairs.some((p) => p.venue === pin.venue) ? pin.venue : undefined
  const mode = pinnedVenue === undefined ? 'auto' : storedMode
  // Auto opens on the server's headline market; the quote's venue stands in while there is none.
  const shownVenue = pinnedVenue ?? pairs.find((pair) => pair.isHeadline)?.venue ?? routedVenue ?? pairs.at(0)?.venue
  const shownPair = pairs.find((pair) => pair.venue === shownVenue)
  // The quote's rate is its routed venue's; any other venue reads the markets feed's.
  const ratePct =
    shownVenue === routedVenue && quotedRatePct !== undefined
      ? quotedRatePct
      : shownPair?.borrowRateBps === undefined
        ? undefined
        : shownPair.borrowRateBps / 100

  const pick = (venue: MarginVenue | undefined, next: PickMode): void => {
    setMarginFormState({ pinnedVenue: venue && group ? { pairKey: group.pairKey, venue } : undefined })
    usePickMode.setState({ mode: next })
    setIsOpen(false)
  }
  const pickChip = (chip: (typeof CHIPS)[number]): void => {
    const best = bestMarginPair(pairs, chip)
    if (chip === 'auto' || best) {
      pick(best?.venue, chip)
    }
  }
  const labels: Record<PickMode, string> = {
    auto: t('margin.route.auto'),
    lowestRate: t('margin.route.lowestRate'),
    highestLeverage: t('margin.route.highestLeverage'),
    highestLiquidity: t('margin.route.highestLiquidity'),
    manual: t('margin.route.manual'),
  }
  const badge = (
    <Flex
      px="$spacing6"
      py="$spacing2"
      borderRadius="$rounded6"
      backgroundColor={mode === 'manual' ? '$surface3' : '$accent2'}
    >
      <Text variant="buttonLabel4" color={mode === 'manual' ? '$neutral1' : '$accent1'}>
        {labels[mode]}
      </Text>
    </Flex>
  )

  return (
    <Popover placement="bottom-start" stayInFrame={{ padding: 16 }} allowFlip open={isOpen} onOpenChange={setIsOpen}>
      <Flex row height={32} alignItems="center" justifyContent="space-between" gap="$spacing12">
        <Flex row alignItems="center" gap="$spacing6">
          <Text variant="body3" color="$neutral2">
            {t('margin.receipt.market')}
          </Text>
          <Popover.Trigger cursor="pointer">
            <Flex row alignItems="center" gap="$spacing2">
              {badge}
              <RotatableChevron direction={isOpen ? 'up' : 'down'} size="$icon.16" color="$neutral3" />
            </Flex>
          </Popover.Trigger>
        </Flex>
        {shownVenue === undefined ? null : (
          <TouchableArea row alignItems="center" gap="$spacing6" onPress={() => setIsOpen(true)}>
            <MarginVenueLogo venue={shownVenue} size="$icon.16" />
            <Text variant="body3" color="$neutral1">
              {marginVenueLabel(shownVenue)}
            </Text>
            {ratePct === undefined ? null : <Text variant="body3" color="$neutral2">{`· ${ratePct.toFixed(2)}%`}</Text>}
          </TouchableArea>
        )}
      </Flex>
      <Popover.Content
        backgroundColor="$surface1"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded16"
        p="$spacing12"
        {...shadowProps}
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
      >
        <Flex gap="$spacing12" minWidth={440}>
          <Flex row gap="$spacing6" flexWrap="wrap">
            {CHIPS.map((chip) => (
              <PresetPill
                key={chip}
                variant={mode === chip ? 'branded' : 'default'}
                size="xsmall"
                onPress={() => pickChip(chip)}
              >
                {labels[chip]}
              </PresetPill>
            ))}
          </Flex>
          <Separator />
          <Flex gap="$spacing2">
            <Flex row gap="$spacing8" px="$spacing8" pb="$spacing4">
              <Text flex={1} variant="body4" color="$neutral2">
                {t('margin.receipt.market')}
              </Text>
              <HeaderCell label={t('margin.selector.columnMaxLeverage')} width={COLUMN_WIDTHS.leverage} />
              <HeaderCell label={t('margin.route.column.borrowRate')} width={COLUMN_WIDTHS.rate} />
              <HeaderCell label={t('common.liquidity')} width={COLUMN_WIDTHS.liquidity} />
              <Flex width={16} />
            </Flex>
            {pairs.map((pair) => (
              <TouchableArea
                key={pair.venue}
                row
                alignItems="center"
                gap="$spacing8"
                p="$spacing8"
                borderRadius="$rounded12"
                backgroundColor={pair.venue === shownVenue ? '$surface2' : '$transparent'}
                hoverStyle={{ backgroundColor: pair.venue === shownVenue ? '$surface2Hovered' : '$surface2' }}
                cursor="pointer"
                onPress={() => pick(pair.venue, 'manual')}
              >
                <Flex fill row alignItems="center" gap="$spacing8">
                  <MarginVenueLogo venue={pair.venue} size="$icon.20" />
                  <Text variant="body3" color="$neutral1">
                    {marginVenueLabel(pair.venue)}
                  </Text>
                </Flex>
                <HeaderCell
                  label={pair.maxLeverage === undefined ? '—' : formatMaxLeverage(pair.maxLeverage)}
                  width={COLUMN_WIDTHS.leverage}
                />
                <HeaderCell label={formatBorrowRate(pair.borrowRateBps)} width={COLUMN_WIDTHS.rate} />
                <HeaderCell
                  label={
                    pair.availableBorrowLiquidity === undefined
                      ? '—'
                      : formatMarginDebtUnits({
                          raw: pair.availableBorrowLiquidity,
                          decimals: pair.debt.decimals,
                          symbol: marginUnwrapSymbol(pair.debt),
                          locale,
                        })
                  }
                  width={COLUMN_WIDTHS.liquidity}
                />
                <Flex width={16}>{pair.venue === shownVenue ? <Check size="$icon.16" color="$accent1" /> : null}</Flex>
              </TouchableArea>
            ))}
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover>
  )
}
