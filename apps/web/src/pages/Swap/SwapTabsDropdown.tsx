import { Text } from '@universe/mycelium'
import type { SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { Check } from 'ui/src/components/icons/Check'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'

/**
 * Compact replacement for the swap header's SegmentedControl, used when the translated tab
 * labels are too wide to fit next to the header icons (CONS-221). Enumerates the same
 * `options` the SegmentedControl renders, so the two views can't diverge.
 */
export function SwapTabsDropdown({
  options,
  currentTab,
  getTabLabel,
  onSelectTab,
}: {
  options: readonly SegmentedControlOption<SwapTab>[]
  currentTab: SwapTab
  getTabLabel: (tab: SwapTab) => string
  onSelectTab: (tab: SwapTab) => void
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      dataTestId={TestID.SwapTabsDropdown}
      menuLabel={
        <Text variant="buttonLabel3" color="$neutral1">
          {getTabLabel(currentTab)}
        </Text>
      }
      // Borderless content-height trigger like TokenDetailsNetworkFilter's, so the menu opens
      // the standard 10px below the label; pl 0 (over TriggerButton's default 14) keeps the
      // label flush with the trade panels' left edge.
      isTriggerStyled={false}
      buttonStyle={{ height: 'auto', pl: 0 }}
      dropdownStyle={{ minWidth: 160 }}
      containerStyle={{ width: 'auto' }}
      // Explicit false so DropdownContent gets its `left: 0` variant — left-aligns the menu
      // with the trigger instead of centering at its static flex position.
      alignRight={false}
      adaptToSheet={false}
    >
      {options.map(({ value: tab, disabled = false }) => {
        return (
          <InternalMenuItem
            key={tab}
            disabled={disabled}
            onPress={() => {
              if (disabled) {
                return
              }
              // onSelectTab (onTabClick) owns analytics + routing, same as the tab buttons.
              onSelectTab(tab)
              setIsOpen(false)
            }}
          >
            <Text
              variant="buttonLabel3"
              color={disabled ? '$neutral3' : currentTab === tab ? '$neutral1' : '$neutral2'}
            >
              {getTabLabel(tab)}
            </Text>
            {currentTab === tab && <Check size="$icon.16" color="$accent1" strokeWidth={4} />}
          </InternalMenuItem>
        )
      })}
    </Dropdown>
  )
}
