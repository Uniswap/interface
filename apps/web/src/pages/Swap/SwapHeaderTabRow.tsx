import { isMobileWeb } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import { SegmentedControl, type SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useTranslation } from 'react-i18next'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { SwapFormSettingsButton } from '~/pages/Swap/Swap/SwapForm'
import { SwapTabsDropdown } from '~/pages/Swap/SwapTabsDropdown'
import { useTabBarOverflow } from '~/pages/Swap/useTabBarOverflow'

// Mirrors the `large` minHeight of the SegmentedControl compat primitive, which exports
// no constant for it. Keep in sync.
const SEGMENTED_CONTROL_LARGE_HEIGHT = 44

/**
 * Swap header row: the tab bar plus the right-side icons.
 *
 * Translated tab labels (e.g. French) can outgrow the header and overlap the settings icon,
 * so when the tabs' natural width no longer fits (per useTabBarOverflow) they collapse into
 * a dropdown.
 */
export function SwapHeaderTabRow({
  options,
  currentTab,
  onTabClick,
  getTabLabel,
  chartToggle,
  trailingContent,
  onHeightChange,
}: {
  options: readonly SegmentedControlOption<SwapTab>[]
  currentTab: SwapTab
  onTabClick: (tab: SwapTab) => void
  getTabLabel: (tab: SwapTab) => string
  chartToggle?: JSX.Element
  trailingContent?: JSX.Element
  onHeightChange: (height: number) => void
}): JSX.Element {
  const { i18n } = useTranslation()
  const { collapsed, containerRef, tabsRef, rightContentRef } = useTabBarOverflow({ measureKey: i18n.language })

  return (
    <Flex
      ref={containerRef}
      row
      alignItems="center"
      justifyContent="space-between"
      // Pin the collapsed row to the SegmentedControl's large height so the form starts at
      // the same y in both modes — no jump when the locale, tab, or collapse state changes.
      minHeight={collapsed ? SEGMENTED_CONTROL_LARGE_HEIGHT : undefined}
      onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
    >
      {collapsed ? (
        <SwapTabsDropdown
          options={options}
          currentTab={currentTab}
          getTabLabel={getTabLabel}
          onSelectTab={onTabClick}
        />
      ) : (
        <Flex ref={tabsRef}>
          <SegmentedControl
            outlined={false}
            size="large"
            options={options}
            selectedOption={currentTab}
            onSelectOption={onTabClick}
            gap={isMobileWeb ? '$spacing8' : undefined}
          />
        </Flex>
      )}
      <Flex ref={rightContentRef} row gap="$spacing8" alignItems="center">
        {chartToggle}
        {currentTab === SwapTab.Swap && <SwapFormSettingsButton />}
        {trailingContent}
      </Flex>
    </Flex>
  )
}
