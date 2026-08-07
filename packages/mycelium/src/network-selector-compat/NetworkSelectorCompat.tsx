/**
 * Web-only, drop-in stand-in for the legacy `NetworkFilterV2`
 * (`uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2.web.tsx`),
 * INFRA-3021 dropdown set — popover-compat shell + option-list-compat
 * content:
 *
 * - the exact `NetworkFilterV2Props` contract (pinned by the type-parity
 *   suite), open state owned internally like the legacy component;
 * - bottom-end placement with the legacy 8px offset; the popup frame carries
 *   the verbatim legacy style payload through the popover compat compiler;
 * - collision avoidance and sizing come from the Base UI positioner
 *   (--available-height) instead of the legacy hand-rolled
 *   getViewportConstrainedMaxHeight — NO breakpoint-based open-side logic,
 *   NO scroll/resize listeners (the #36826 bug class, see the exclusions
 *   ledger);
 * - search, tier sections, rows, keyboard navigation via
 *   SearchableOptionListCompat; chain metadata / i18n / analytics stay
 *   host-injected seams;
 * - the mWeb sheet leg is GATED on the Sheet/Dialog track: the
 *   webBottomSheetProps payload (snapPoints [60] percent parity) is passed
 *   through accepted-but-inert, and `isSheet` suppresses autoFocus exactly
 *   like the legacy sheet branch.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { SearchableOptionListCompat } from '../option-list-compat/SearchableOptionList'
import type { OptionListItemCompat, OptionListSectionCompat } from '../option-list-compat/types'
import { AdaptiveWebPopoverContentCompat } from '../popover-compat/AdaptiveWebPopoverContentCompat'
import { PopoverCompat } from '../popover-compat/PopoverCompat'
import { TriggerButtonCompat } from '../trigger-button-compat/TriggerButtonCompat'
import {
  NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME,
  NETWORK_SELECTOR_DROPDOWN_OFFSET,
  NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
  NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT,
} from './compile'
import type { NetworkSelectorChainDisplayCompat, NetworkSelectorCompatProps } from './types'

const TRIGGER_TESTID = 'tokens-network-filter-trigger'

function fallbackDisplay(chainId: number): NetworkSelectorChainDisplayCompat {
  return { label: `Chain ${chainId}` }
}

export function NetworkSelectorCompat<TChainId extends number = number>({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  tieredOptions,
  getChainDisplay,
  defaultChainId,
  allNetworksLogoPile,
  allNetworksLogo,
  labels,
  telemetryAdapter,
  isSheet,
  triggerTooltipLabel,
  testID,
}: NetworkSelectorCompatProps<TChainId>): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false)

  const display = (chainId: TChainId): NetworkSelectorChainDisplayCompat =>
    getChainDisplay?.(chainId) ?? fallbackDisplay(chainId)

  const allNetworksLabel = labels?.allNetworks ?? 'All networks'

  // Reactive open/close reporting through the host-injected telemetry seam.
  const wasOpenRef = React.useRef(false)
  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      telemetryAdapter?.onSelectorOpened?.()
    } else if (!isOpen && wasOpenRef.current) {
      telemetryAdapter?.onSelectorClosed?.()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, telemetryAdapter])

  const handleOpenChange = (nextOpen: boolean): void => {
    // Legacy parity: the Tamagui popover closes on outside press and Escape
    // through onOpenChange; every Base UI close request maps the same way.
    setIsOpen(nextOpen)
  }

  const handleSelect = (chainId: TChainId | null): void => {
    telemetryAdapter?.onNetworkSelected?.({ chainId, previousChainId: selectedChain })
    onPressChain(chainId)
    setIsOpen(false)
  }

  const chainItem = (chainId: TChainId): OptionListItemCompat => {
    const chainDisplay = display(chainId)
    return {
      id: String(chainId),
      label: chainDisplay.label,
      keywords: chainDisplay.keywords,
      logo: chainDisplay.logo,
      badge: chainDisplay.badge,
      isSelected: selectedChain === chainId,
      // Legacy row testID: `${ElementName.NetworkButton}-${chainId ?? 'all'}`.
      testID: `network-button-${chainId}`,
      onSelect: () => handleSelect(chainId),
    }
  }

  const allNetworksItem: OptionListItemCompat = {
    id: 'all',
    label: allNetworksLabel,
    logo: allNetworksLogo,
    logoPile: allNetworksLogoPile,
    isSelected: selectedChain === null,
    testID: 'network-button-all',
    onSelect: () => handleSelect(null),
  }

  const sections: OptionListSectionCompat[] = []
  if (includeAllNetworks === true) {
    sections.push({ key: 'all-networks', items: [allNetworksItem] })
  }
  const hasTiers = tieredOptions !== undefined && tieredOptions.withBalances.length > 0
  if (hasTiers) {
    if (tieredOptions.withBalances.length > 0) {
      sections.push({
        key: 'with-balances',
        title: labels?.withBalances ?? 'Your balances',
        items: tieredOptions.withBalances.map((option) => chainItem(option.chainId)),
      })
    }
    if (tieredOptions.otherNetworks.length > 0) {
      sections.push({
        key: 'other-networks',
        title: labels?.otherNetworks ?? 'Other networks',
        items: tieredOptions.otherNetworks.map((option) => chainItem(option.chainId)),
      })
    }
  } else {
    sections.push({ key: 'chains', items: chainIds.map(chainItem) })
  }

  // Legacy displayed-chain arithmetic (NetworkFilterV2.web.tsx).
  const displayedChainId = selectedChain ?? (includeAllNetworks === true ? null : (defaultChainId ?? null))
  const triggerDisplay = displayedChainId === null ? undefined : display(displayedChainId)
  const triggerLogo =
    displayedChainId === null ? allNetworksLogo : (triggerDisplay?.triggerLogo ?? triggerDisplay?.logo)

  return (
    <PopoverCompat
      open={isOpen}
      placement="bottom-end"
      offset={{ mainAxis: NETWORK_SELECTOR_DROPDOWN_OFFSET }}
      onOpenChange={handleOpenChange}
    >
      <PopoverCompat.Trigger>
        {/* The legacy trigger: logo + rotating chevron, no pill chrome. */}
        <TriggerButtonCompat
          outlined={false}
          isExpanded={isOpen}
          testID={testID ?? TRIGGER_TESTID}
          tooltipLabel={triggerTooltipLabel}
          className="h-auto gap-[4px] p-0 pl-0 pr-0"
        >
          {triggerLogo !== undefined && triggerLogo !== null && (
            <span data-slot="network-selector-trigger-logo" className="flex flex-shrink-0">
              {triggerLogo}
            </span>
          )}
        </TriggerButtonCompat>
      </PopoverCompat.Trigger>

      <AdaptiveWebPopoverContentCompat
        {...NETWORK_SELECTOR_POPOVER_CONTENT_PROPS_COMPAT}
        isOpen={isOpen}
        placement="bottom-end"
        // GATED sheet leg: accepted-but-inert until the Sheet/Dialog track
        // lands (legacy parity payload — snapPoints [60] percent).
        webBottomSheetProps={{ onClose: () => setIsOpen(false), snapPoints: [60], snapPointsMode: 'percent' }}
      >
        <div className={NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME}>
          <SearchableOptionListCompat
            isOpen={isOpen}
            isSheet={isSheet}
            sections={sections}
            searchPlaceholder={labels?.searchPlaceholder ?? 'Search networks'}
            noResultsLabel={labels?.noResults}
            listClassName={NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME}
          />
        </div>
      </AdaptiveWebPopoverContentCompat>
    </PopoverCompat>
  )
}
