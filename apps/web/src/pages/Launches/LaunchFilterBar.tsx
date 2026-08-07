import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { GridView } from 'ui/src/components/icons/GridView'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { iconSizes } from 'ui/src/theme'
import { NetworkOption } from 'uniswap/src/components/network/NetworkOption'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import {
  DropdownSizeVariants,
  NETWORK_FILTER_BUTTON_STYLES,
  NETWORK_FILTER_DROPDOWN_STYLE,
  NetworkFilter,
} from '~/components/NetworkFilter/NetworkFilter'
import { ExploreFilterChip } from '~/pages/Explore/categories/ExploreCategoryChips'
import { getLaunchpadLogoBorderRadius, LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'
import { LaunchQuickFilter } from '~/pages/Launches/useLaunchesList'

export interface LaunchpadOption {
  value: string
  label: string
  logoUrl?: string
}

/** Quick-select category chips (All / Recently launched / Trending) on the literal Explore chip. */
export function LaunchQuickSelects({
  value,
  onSelect,
}: {
  value: LaunchQuickFilter
  onSelect: (filter: LaunchQuickFilter) => void
}): JSX.Element {
  const { t } = useTranslation()

  const chips = useMemo(
    () => [
      {
        value: LaunchQuickFilter.All,
        label: t('common.all'),
        renderIcon: (color: '$neutral1' | '$neutral2') => <GridView size="$icon.20" color={color} />,
      },
      {
        value: LaunchQuickFilter.RecentlyLaunched,
        label: t('launches.quickSelect.recentlyLaunched'),
        renderIcon: (color: '$neutral1' | '$neutral2') => <Sparkle size="$icon.20" color={color} />,
      },
      {
        value: LaunchQuickFilter.Trending,
        label: t('launches.quickSelect.trending'),
        renderIcon: (color: '$neutral1' | '$neutral2') => <TrendUp size="$icon.20" color={color} />,
      },
    ],
    [t],
  )

  return (
    // Chips can exceed small viewports — scroll them in place instead of wrapping or widening the page.
    <Flex row gap="$gap4" maxWidth="100%" className="scrollbar-hidden" $md={{ '$platform-web': { overflowX: 'auto' } }}>
      {chips.map((chip) => (
        <ExploreFilterChip
          key={chip.value}
          active={value === chip.value}
          label={chip.label}
          renderIcon={chip.renderIcon}
          onPress={() => {
            // Only real category changes are logged; re-clicking the active chip is a no-op.
            if (value === chip.value) {
              return
            }
            sendAnalyticsEvent(UniswapEventName.LaunchQuickFilterSelected, { filter: chip.value })
            onSelect(chip.value)
          }}
        />
      ))}
    </Flex>
  )
}

/** Trigger stack caps at this many logos; further selections collapse into a +N bubble. */
const MAX_TRIGGER_STACK_LOGOS = 3
/** Overlap between stacked trigger logos; the $surface1 ring keeps them reading as separate. */
const TRIGGER_STACK_OVERLAP = 8
/** Outer size of one stacked slot: the icon20 logo plus its 2px ($spacing2) ring on each side. */
const TRIGGER_STACK_SLOT_SIZE = iconSizes.icon20 + 4
/** Rounded-rect radius for the ring/bubble, proportional to the slot like the logo's own radius. */
const TRIGGER_STACK_SLOT_RADIUS = getLaunchpadLogoBorderRadius(TRIGGER_STACK_SLOT_SIZE)

/**
 * Overlapping stack of the selected launchpads' logos (registry order), avatar-stack style.
 * `totalCount` may exceed `options` (registry still loading / unknown ids); the +N bubble absorbs
 * the difference so the trigger never claims fewer filters than are applied.
 */
function LaunchpadLogoStack({ options, totalCount }: { options: LaunchpadOption[]; totalCount: number }): JSX.Element {
  const { t } = useTranslation()
  const stackedOptions = options.slice(0, MAX_TRIGGER_STACK_LOGOS)
  const overflowCount = totalCount - stackedOptions.length
  const slotCount = stackedOptions.length + (overflowCount > 0 ? 1 : 0)

  return (
    <Flex row alignItems="center" aria-label={options.map((option) => option.label).join(', ')}>
      {stackedOptions.map((option, index) => (
        <Flex
          key={option.value}
          testID={`${TestID.LaunchpadFilterTriggerLogoPrefix}${option.value}`}
          ml={index === 0 ? 0 : -TRIGGER_STACK_OVERLAP}
          borderWidth="$spacing2"
          borderColor="$surface1"
          borderRadius={TRIGGER_STACK_SLOT_RADIUS}
          zIndex={slotCount - index}
        >
          <LaunchpadLogo size={iconSizes.icon20} url={option.logoUrl} name={option.label} />
        </Flex>
      ))}
      {overflowCount > 0 && (
        <Flex
          centered
          ml={-TRIGGER_STACK_OVERLAP}
          borderWidth="$spacing2"
          borderColor="$surface1"
          borderRadius={TRIGGER_STACK_SLOT_RADIUS}
          backgroundColor="$surface3"
          width={TRIGGER_STACK_SLOT_SIZE}
          height={TRIGGER_STACK_SLOT_SIZE}
          zIndex={slotCount - stackedOptions.length}
        >
          <Text allowFontScaling={false} variant="buttonLabel4" color="$neutral2" textAlign="center">
            {t('launches.filter.launchpadOverflow', { count: overflowCount })}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

/**
 * Registry-driven launchpad multi-select on the literal network-dropdown chrome (same trigger
 * sizing, menu shell, and option rows as NetworkFilter); rows toggle without closing the menu.
 * The trigger previews the selection: the launchpad's logo + name for a single pick, an
 * overlapping logo stack for a subset, and the all-launchpads label when nothing (or everything)
 * is selected.
 */
function LaunchpadMultiSelect({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: LaunchpadOption[]
  selected: Set<string>
  onToggle: (value: string) => void
  onClear: () => void
}): JSX.Element {
  const media = useMedia()
  const [isOpen, setIsOpen] = useState(false)

  const selectedOptions = useMemo(() => options.filter((option) => selected.has(option.value)), [options, selected])
  // Empty derives from the raw selection, and all-selected requires a resolved registry, so ids
  // the registry doesn't (yet) know — e.g. before useLaunchpads resolves — still read as filtered.
  const isAllSelected = selected.size === 0 || (options.length > 0 && selectedOptions.length === options.length)
  const singleSelection =
    !isAllSelected && selected.size === 1 && selectedOptions.length === 1 ? selectedOptions[0] : undefined

  return (
    <Flex testID={TestID.LaunchpadFilter}>
      <Dropdown
        isOpen={isOpen}
        toggleOpen={setIsOpen}
        dataTestId={TestID.LaunchpadFilterTrigger}
        menuLabel={
          singleSelection ? (
            <Flex row alignItems="center" gap="$gap8">
              <LaunchpadLogo size={iconSizes.icon20} url={singleSelection.logoUrl} name={singleSelection.label} />
              <Text variant="buttonLabel3" width="max-content">
                {singleSelection.label}
              </Text>
            </Flex>
          ) : isAllSelected ? (
            <Text variant="buttonLabel3" width="max-content">
              {label}
            </Text>
          ) : (
            <LaunchpadLogoStack options={selectedOptions} totalCount={selected.size} />
          )
        }
        dropdownStyle={NETWORK_FILTER_DROPDOWN_STYLE}
        buttonStyle={NETWORK_FILTER_BUTTON_STYLES[DropdownSizeVariants.Medium]}
        allowFlip
        alignRight={!media.lg}
      >
        <Flex p="$spacing8">
          <Flex
            cursor="pointer"
            testID={`${TestID.LaunchpadFilterOptionPrefix}all`}
            onPress={() => {
              sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
                element: ElementName.LaunchesLaunchpadFilterClear,
              })
              onClear()
            }}
          >
            <NetworkOption
              chainId={null}
              isNew={false}
              currentlySelected={selected.size === 0}
              customLogo={<GridView size="$icon.24" color="$neutral1" />}
              customLabel={label}
            />
          </Flex>
          {options.map((option) => (
            <Flex
              key={option.value}
              cursor="pointer"
              testID={`${TestID.LaunchpadFilterOptionPrefix}${option.value}`}
              onPress={() => {
                sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
                  element: ElementName.LaunchesLaunchpadFilterOption,
                  launchpad_id: option.value,
                  // Selected state after the toggle.
                  selected: !selected.has(option.value),
                })
                onToggle(option.value)
              }}
            >
              <NetworkOption
                chainId={null}
                isNew={false}
                currentlySelected={selected.has(option.value)}
                customLogo={<LaunchpadLogo size={iconSizes.icon24} url={option.logoUrl} name={option.label} />}
                customLabel={option.label}
              />
            </Flex>
          ))}
        </Flex>
      </Dropdown>
    </Flex>
  )
}

export interface LaunchFilterBarProps {
  launchpadOptions: LaunchpadOption[]
  networks: UniverseChainId[]
  showComingSoonNetworks?: boolean
  selectedSources: Set<string>
  networkChainId: UniverseChainId | undefined
  onToggleSource: (value: string) => void
  onClearSources: () => void
  onSelectNetwork: (chainId: UniverseChainId | undefined) => void
}

/**
 * Action row for the All-launches section, mirroring the Auction Explore table's action row: one
 * row of controls with the launchpad + network selectors on the far right. The network selector is
 * the same NetworkFilter the Auctions table uses (thumbnail-only trigger).
 */
export function LaunchFilterBar({
  launchpadOptions,
  networks,
  showComingSoonNetworks,
  selectedSources,
  networkChainId,
  onToggleSource,
  onClearSources,
  onSelectNetwork,
}: LaunchFilterBarProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row gap="$spacing8" justifyContent="flex-start" $md={{ width: '100%' }}>
      <LaunchpadMultiSelect
        label={t('launches.filter.allLaunchpads')}
        options={launchpadOptions}
        selected={selectedSources}
        onToggle={onToggleSource}
        onClear={onClearSources}
      />
      <NetworkFilter
        position="right"
        currentChainId={networkChainId}
        networks={networks}
        showComingSoonOption={showComingSoonNetworks}
        tracePage={InterfacePageName.LaunchesPage}
        onPress={onSelectNetwork}
      />
    </Flex>
  )
}
