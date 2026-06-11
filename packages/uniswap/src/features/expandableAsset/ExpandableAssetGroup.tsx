import type { ReactNode } from 'react'
import { Flex } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'
import { getIssuerCount } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { getExpandableIssuerPanelHeightPx } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableIssuerIdentity } from 'uniswap/src/features/expandableAsset/ExpandableIssuerIdentity'
import { ExpandableIssuerRows } from 'uniswap/src/features/expandableAsset/ExpandableIssuerPanel'
import { ExpandableParentAssetIdentity } from 'uniswap/src/features/expandableAsset/ExpandableParentAssetIdentity'
import { ExpandableSearchRowContainer } from 'uniswap/src/features/expandableAsset/ExpandableSearchRowContainer'

type ExpandableAssetGroupProps = {
  asset: Rwa
  enabledChainIds: readonly UniverseChainId[]
  isExpanded: boolean
  onToggle: () => void
  onIssuerPress?: (issuer: IssuerToken) => void
  /** Called when the parent row is tapped for a single-issuer asset (cannot expand). */
  onParentPress?: () => void
  /** Renders the category pill on the row. False for the no-query section (header conveys it). */
  showCategoryTag?: boolean
  /** Shows the issuer count next to the symbol on the collapsed subline (no-query section only). */
  showTokenCount?: boolean
  /** Keyboard list-nav control (web) for the row's focus highlight + Enter-to-activate. */
  focusedRowControl?: FocusedRowControl
  /** testID applied to the row's touchable. */
  testID?: string
}

export function ExpandableAssetGroup({
  asset,
  enabledChainIds,
  isExpanded,
  onToggle,
  onIssuerPress,
  onParentPress,
  showCategoryTag = true,
  showTokenCount = false,
  focusedRowControl,
  testID,
}: ExpandableAssetGroupProps): ReactNode {
  const issuerCount = getIssuerCount(asset)
  const canExpand = issuerCount > 1

  const categoryTag = showCategoryTag ? (
    <CategoryTag category={getRwaTagCategory({ categories: asset.categories })} />
  ) : null

  const chevron = canExpand ? (
    <Flex p="$spacing8" borderRadius="$rounded8">
      {isExpanded ? (
        <ChevronsIn size="$icon.16" color="$neutral2" />
      ) : (
        <ChevronsOut size="$icon.16" color="$neutral2" />
      )}
    </Flex>
  ) : null

  // A non-expandable (single-issuer) collection renders the issuer identity (issuer label + symbol + address) so
  // the row matches the issuer it navigates to; multi-issuer rows render the parent ticker identity.
  const soleIssuer = canExpand ? undefined : asset.issuerTokens[0]
  const identity = soleIssuer ? (
    <ExpandableIssuerIdentity asset={asset} issuer={soleIssuer} enabledChainIds={enabledChainIds} variant="search" />
  ) : (
    <ExpandableParentAssetIdentity
      asset={asset}
      canExpand={canExpand}
      isExpanded={isExpanded}
      variant="search"
      showTokenCount={showTokenCount}
    />
  )

  // Identity + category tag + chevron. The identity flexes (minWidth 0) so it shrinks and truncates instead of
  // pushing the tag/chevron off the row.
  const headerChildren = (
    <>
      <Flex flex={1} minWidth={0}>
        {identity}
      </Flex>
      {categoryTag}
      {chevron}
    </>
  )

  // The row structure and (on web) the expand/collapse animation live in the platform-split
  // ExpandableSearchRowContainer. ExpandableAssetGroup owns the header (identity + tag + chevron) and the
  // issuer-panel element; the container handles layout, mount/unmount, and the reveal animation.
  return (
    <ExpandableSearchRowContainer
      isExpanded={isExpanded}
      canExpand={canExpand}
      header={headerChildren}
      issuerPanel={
        <ExpandableIssuerRows
          asset={asset}
          enabledChainIds={enabledChainIds}
          variant="search"
          onIssuerPress={onIssuerPress}
        />
      }
      issuerPanelHeightPx={getExpandableIssuerPanelHeightPx({ issuerCount, variant: 'search' })}
      focusedRowControl={focusedRowControl}
      testID={testID}
      onToggle={onToggle}
      onParentPress={onParentPress}
    />
  )
}
