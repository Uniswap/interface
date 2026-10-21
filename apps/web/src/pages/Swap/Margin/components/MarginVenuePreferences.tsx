import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalCloseIcon, Separator, Switch } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isDefaultMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { useResetMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useResetMarginVenues'
import { useToggleMarginVenue } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useToggleMarginVenue'
import { useEvent } from 'utilities/src/react/hooks'
import type { MarginPairGroup } from '~/constants/margin'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import {
  formatBorrowRate,
  formatMarginDebtUnits,
  formatMaxLeverage,
  marginVenueLabel,
} from '~/pages/Swap/Margin/marginFormat'
import { marginPairGroupLabel, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'
import { buildMarginVenueOptOutRows, type MarginVenueOptOutRow } from '~/pages/Swap/Margin/marginVenueOptOut'

// The pair group the form currently trades. Falls back to the first group for the same reason the
// form falls back to markets.at(0): a stored key the registry no longer lists is adopted away one
// render later, and until then the two surfaces must name the same pair.
export function useActiveMarginPairGroup(): MarginPairGroup | undefined {
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { groups } = useMarginMarkets()
  return useMemo(() => groups.find((group) => group.pairKey === pairKey) ?? groups.at(0), [groups, pairKey])
}

function VenueRow({ row }: { row: MarginVenueOptOutRow }): JSX.Element {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const toggleVenue = useToggleMarginVenue()
  const { pair, isEnabled, cantDisable } = row
  const onToggle = useEvent(() => toggleVenue({ venue: pair.venue }))

  // "Max 5x · Borrow rate 4.2% · Liquidity 12.3M USDC" — one line rather than columns: a venue's
  // three numbers are all secondary to which venue it is, and a rate-less or depth-less venue drops
  // its chunk instead of leaving a labelled gap.
  const metrics = [
    t('margin.stats.maxLeverage', { max: formatMaxLeverage(pair.maxLeverage) }),
    pair.borrowRateBps === undefined
      ? undefined
      : t('margin.selector.borrowRateValue', { rate: formatBorrowRate(pair.borrowRateBps) }),
    pair.availableBorrowLiquidity === undefined
      ? undefined
      : t('margin.stats.liquidity', {
          amount: formatMarginDebtUnits({
            raw: pair.availableBorrowLiquidity,
            decimals: pair.debt.decimals,
            symbol: marginUnwrapSymbol(pair.debt),
            locale,
          }),
        }),
  ].filter((chunk): chunk is string => chunk !== undefined)

  return (
    <Flex row alignItems="center" gap="$spacing12" py="$spacing12" testID={TestID.MarginVenueRow}>
      <MarginVenueLogo venue={pair.venue} size="$icon.24" />
      <Flex fill gap="$spacing2">
        <Text variant="body2" color="$neutral1">
          {marginVenueLabel(pair.venue)}
        </Text>
        <Text variant="body4" color="$neutral2">
          {metrics.join(' · ')}
        </Text>
        {/* Says why the switch won't move; without it a locked toggle reads as broken. */}
        {cantDisable ? (
          <Text variant="body4" color="$neutral3">
            {t('margin.venues.lastEnabled')}
          </Text>
        ) : null}
      </Flex>
      <Switch variant="branded" checked={isEnabled} disabled={cantDisable} onCheckedChange={onToggle} />
    </Flex>
  )
}

// Master switch. Only the ON direction does anything: "Default" IS the empty exclusion set, so there
// is nothing for turning it off to mean — the switch is controlled, so the no-op leaves it drawn on.
function DefaultVenuesRow(): JSX.Element {
  const { t } = useTranslation()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const resetVenues = useResetMarginVenues()
  const onCheckedChange = useEvent((checked: boolean) => {
    if (checked) {
      resetVenues()
    }
  })

  return (
    <Flex row alignItems="center" gap="$spacing12" py="$spacing12">
      <Flex fill gap="$spacing2">
        <Text variant="body2" color="$neutral1">
          {t('margin.venues.default')}
        </Text>
        <Text variant="body4" color="$neutral2">
          {t('margin.venues.defaultCaption')}
        </Text>
      </Flex>
      <Switch
        variant="branded"
        checked={isDefaultMarginVenues({ excludedVenues })}
        testID={TestID.MarginVenueDefaultToggle}
        onCheckedChange={onCheckedChange}
      />
    </Flex>
  )
}

// The opt-out sheet for one pair: a master "Default" switch over per-venue rows. Exclusions are a
// GLOBAL preference, so a venue switched off here is off for every pair that offers it — the rows
// just show what that means for this one.
export function MarginVenuePreferencesModal({
  group,
  isOpen,
  onClose,
}: {
  group: MarginPairGroup
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const rows = useMemo(
    () => buildMarginVenueOptOutRows({ pairs: group.pairs, excludedVenues }),
    [group.pairs, excludedVenues],
  )
  const hasNoEnabledVenues = rows.every((row) => !row.isEnabled)

  return (
    <Modal name={ModalName.MarginVenuePreferences} isModalOpen={isOpen} maxWidth={480} onClose={onClose}>
      <Flex gap="$spacing12">
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
          <Flex gap="$spacing2">
            <Text variant="subheading1" color="$neutral1">
              {t('margin.venues.title')}
            </Text>
            <Text variant="body4" color="$neutral2">
              {marginPairGroupLabel({ group })}
            </Text>
          </Flex>
          <ModalCloseIcon onClose={onClose} />
        </Flex>
        <Text variant="body4" color="$neutral2">
          {t('margin.venues.caption')}
        </Text>
        {/* Reachable from any pair whose venues the user switched off elsewhere — the preference is
            global, so this pair can end up empty without a single toggle in this sheet. */}
        {hasNoEnabledVenues ? (
          <Flex p="$spacing12" borderRadius="$rounded12" backgroundColor="$surface2" testID={TestID.MarginVenuesEmpty}>
            <Text variant="body3" color="$neutral2">
              {t('margin.venues.emptyState')}
            </Text>
          </Flex>
        ) : null}
        <Flex>
          <DefaultVenuesRow />
          <Separator />
          {rows.map((row) => (
            <VenueRow key={row.pair.key} row={row} />
          ))}
        </Flex>
      </Flex>
    </Modal>
  )
}

// The ⚙︎-popover entry: current preference on the right. Press-handling and the sheet itself belong
// to the popover — it has to close itself before the modal it launches opens over it.
export function MarginVenueSettingsRow({
  group,
  onPress,
}: {
  group: MarginPairGroup
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  // Counted off the same builder the sheet renders, so "N of M" cannot drift from the live switches.
  const enabled = useMemo(
    () => buildMarginVenueOptOutRows({ pairs: group.pairs, excludedVenues }).filter((row) => row.isEnabled).length,
    [group.pairs, excludedVenues],
  )

  return (
    <TouchableArea testID={TestID.MarginVenuesSettingsEntry} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
        <Text variant="body3" color="$neutral2">
          {t('margin.venues.title')}
        </Text>
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral1">
            {isDefaultMarginVenues({ excludedVenues })
              ? t('margin.venues.default')
              : t('margin.venues.enabledOfTotal', { enabled, total: group.pairs.length })}
          </Text>
          <RotatableChevron direction="right" size="$icon.16" color="$neutral3" />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

// Blocker shown in the form when the active pair has no venue left to route to. The quote is already
// disabled at that point (an empty allowlist builds no request) — this says why, and offers the way
// back into the sheet that caused it.
export function MarginVenueEmptyNotice(): JSX.Element | null {
  const { t } = useTranslation()
  const group = useActiveMarginPairGroup()
  const [isOpen, setIsOpen] = useState(false)
  const open = useEvent(() => setIsOpen(true))
  const close = useEvent(() => setIsOpen(false))

  if (!group) {
    return null
  }

  return (
    <Flex
      gap="$spacing4"
      p="$spacing12"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      testID={TestID.MarginVenuesNotice}
    >
      <Text variant="body3" color="$neutral2">
        {t('margin.venues.emptyState')}
      </Text>
      <TouchableArea onPress={open}>
        <Text variant="body3" color="$accent1">
          {t('margin.venues.manage')}
        </Text>
      </TouchableArea>
      {isOpen ? <MarginVenuePreferencesModal group={group} isOpen onClose={close} /> : null}
    </Flex>
  )
}
