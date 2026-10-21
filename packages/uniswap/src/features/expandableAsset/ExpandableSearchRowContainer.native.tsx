import { Flex } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableSearchRow } from 'uniswap/src/features/expandableAsset/ExpandableSearchRow'
import type { ExpandableSearchRowContainerProps } from 'uniswap/src/features/expandableAsset/ExpandableSearchRowContainer'

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
      // Instant: Legend List doesn't pick up the animated height, so rows below overlap the panel on mobile.
      panelSlot={
        <HeightAnimator animationDisabled unmountChildrenWhenCollapsed open={showShell}>
          <Flex pt={EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX} width="100%">
            {issuerPanel}
          </Flex>
        </HeightAnimator>
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
