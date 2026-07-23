import { Flex } from 'ui/src'
import { EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableSearchRow } from 'uniswap/src/features/expandableAsset/ExpandableSearchRow'
import type { ExpandableSearchRowContainerProps } from 'uniswap/src/features/expandableAsset/ExpandableSearchRowContainer'

/**
 * Native: no animation. FlashList force-sizes each cell via `getExpandableSearchRowHeightPx` and can't animate a
 * cell's height, so the panel renders instantly. The parent↔panel gap is a `pt` spacer (the shell carries gap=0),
 * keeping the rendered height in sync with the layout helper. `issuerPanelHeightPx` is web-only and ignored here.
 */
export function ExpandableSearchRowContainer({
  isExpanded,
  canExpand,
  onToggle,
  onParentPress,
  onParentLongPress,
  parentHref,
  header,
  issuerPanel,
  focusedRowControl,
  testID,
}: ExpandableSearchRowContainerProps): JSX.Element {
  const showShell = canExpand && isExpanded

  return (
    <ExpandableSearchRow
      showShell={showShell}
      canExpand={canExpand}
      isExpanded={isExpanded}
      header={header}
      panelSlot={
        showShell ? (
          <Flex pt={EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX} width="100%">
            {issuerPanel}
          </Flex>
        ) : null
      }
      focusedRowControl={focusedRowControl}
      testID={testID}
      modifierPressHref={parentHref}
      onToggle={onToggle}
      onParentPress={onParentPress}
      onParentLongPress={onParentLongPress}
    />
  )
}
