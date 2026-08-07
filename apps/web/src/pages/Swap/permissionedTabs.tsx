import type { SegmentedControlOption } from 'ui/src'
import { Text } from 'ui/src'
import { SwapTab } from 'uniswap/src/types/screens/interface'

type PermissionedTabBlocks = {
  // Folds loading into the gate so a tab can't be entered before the KYC check resolves.
  limitBlocked: boolean
  buySellBlocked: boolean
}

// Swap is never gated (it hosts the in-form banner + Verify Identity CTA); Limit/Buy/Sell offer no
// path to verify, so when the token is permissioned and the wallet isn't allowlisted we both grey the
// tab button and block activation.
export function isTabPermissionedBlocked(
  tab: SwapTab,
  { limitBlocked, buySellBlocked }: PermissionedTabBlocks,
): boolean {
  if (tab === SwapTab.Limit) {
    return limitBlocked
  }
  if (tab === SwapTab.Buy || tab === SwapTab.Sell) {
    return buySellBlocked
  }
  return false
}

export function buildSwapTabOptions({
  tabs,
  currentTab,
  syncTabToUrl,
  getTabLabel,
  isTabBlocked,
}: {
  tabs: readonly SwapTab[]
  currentTab: SwapTab
  syncTabToUrl: boolean
  getTabLabel: (tab: SwapTab) => string
  isTabBlocked: (tab: SwapTab) => boolean
}): readonly SegmentedControlOption<SwapTab>[] {
  return tabs.map((tab) => {
    const disabled = isTabBlocked(tab)
    return {
      value: tab,
      disabled,
      // Use href for proper link semantics when syncing to URL (SEO, accessibility, right-click menu).
      // Omit it for a disabled tab so the anchor can't navigate past the disabled state.
      href: syncTabToUrl && !disabled ? `/${tab}` : undefined,
      display: (
        <Text
          variant="buttonLabel3"
          hoverStyle={disabled ? undefined : { color: '$neutral1' }}
          // A custom `display` bypasses SegmentedControl's built-in disabled text color, so grey the
          // disabled tab here to match its `getOptionTextColor` ($neutral3) treatment.
          color={disabled ? '$neutral3' : currentTab === tab ? '$neutral1' : '$neutral2'}
        >
          {getTabLabel(tab)}
        </Text>
      ),
    }
  })
}
