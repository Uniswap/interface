import { UniverseChainId } from '@universe/chains'
import { isMobileApp } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { getRwaTagCategory } from 'uniswap/src/data/apiClients/dataApiService/rwa/getRwaTagCategory'
import { getIssuerCount } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { getExpandableIssuerPanelHeightPx } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableIssuerIdentity } from 'uniswap/src/features/expandableAsset/ExpandableIssuerIdentity'
import { ExpandableIssuerRows } from 'uniswap/src/features/expandableAsset/ExpandableIssuerPanel'
import { ExpandableParentAssetIdentity } from 'uniswap/src/features/expandableAsset/ExpandableParentAssetIdentity'
import { ExpandableSearchRowContainer } from 'uniswap/src/features/expandableAsset/ExpandableSearchRowContainer'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import type { CategoryTagPlacement } from 'uniswap/src/features/tokenCategories/CategoryTagPill'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type ExpandableAssetGroupProps = {
  asset: Rwa
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
  isExpanded: boolean
  onToggle: () => void
  onIssuerPress?: (issuer: IssuerToken) => void
  onParentPress?: () => void
  showCategoryTag?: boolean
  categoryTagPlacement?: CategoryTagPlacement
  focusedRowControl?: FocusedRowControl
  testID?: string
  /** When set, adds the context menu to issuer rows. Forwarded to the expanded multi-issuer sub-rows, and used to
   *  wrap the collapsed single-issuer row's identity — the shell keeps the tap, while the menu opens via the
   *  wired-in `onParentLongPress` (native/mobile-web touch) + the web `…`/right-click. */
  renderIssuerRow?: (args: RenderIssuerRowArgs) => ReactNode
  /** Gates the collapsed single-issuer row's native long-press: it is only wired (haptic + open) once the issuer's
   *  menu can actually mount — i.e. its primary-chain CurrencyInfo has resolved. Without this guard the long-press
   *  latches the controlled menu open while the row is still menu-less, so it pops open on its own when the batched
   *  query lands. Only meaningful alongside `renderIssuerRow`; if omitted, the collapsed long-press stays disabled. */
  isIssuerMenuReady?: (issuer: IssuerToken) => boolean
  getIssuerHref?: (issuer: IssuerToken) => string | undefined
  onIssuerModifierPress?: (issuer: IssuerToken) => void
  rightElement?: ReactNode
  volumeDetail?: string
  showIssuerStats?: boolean
  showIssuerTag?: boolean
}

export function ExpandableAssetGroup({
  asset,
  enabledChainIds,
  chainFilter,
  isExpanded,
  onToggle,
  onIssuerPress,
  onParentPress,
  onIssuerModifierPress,
  showCategoryTag = true,
  categoryTagPlacement = 'right',
  focusedRowControl,
  testID,
  renderIssuerRow,
  isIssuerMenuReady,
  getIssuerHref,
  rightElement,
  volumeDetail,
  showIssuerStats,
  showIssuerTag,
}: ExpandableAssetGroupProps): ReactNode {
  const issuerCount = getIssuerCount(asset)
  const canExpand = issuerCount > 1

  // Collapsed single-issuer row: this component owns the menu open-state so the shell's native long-press
  // (onParentLongPress) and the row's web `…`/right-click drive the SAME controlled menu. Hooks run unconditionally
  // (multi-issuer rows simply don't use them). `closeMenu` stays a bare `setFalse` reference so the row's
  // copyAddressOverride memo (which depends on it) stays stable.
  const { value: isMenuOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()
  const isParentRowFocused = focusedRowControl
    ? focusedRowControl.focusedRowIndex === focusedRowControl.rowIndex
    : false

  const isTitlePlacement = categoryTagPlacement === 'title'
  const categoryTag = showCategoryTag ? (
    <CategoryTag category={getRwaTagCategory({ categories: asset.categories })} />
  ) : null
  const titleCategoryTag = isTitlePlacement ? categoryTag : null
  const rightCategoryTag = isTitlePlacement ? null : categoryTag

  const rightChevron =
    canExpand && !isTitlePlacement ? (
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
  const parentHref = soleIssuer ? getIssuerHref?.(soleIssuer) : undefined
  const usesMenuRow = Boolean(soleIssuer && renderIssuerRow)
  const soleIssuerIdentity = soleIssuer ? (
    <ExpandableIssuerIdentity
      asset={asset}
      issuer={soleIssuer}
      enabledChainIds={enabledChainIds}
      variant="search"
      chainFilter={chainFilter}
      categoryTag={titleCategoryTag}
      volumeDetail={volumeDetail}
      showIssuerTag={showIssuerTag}
    />
  ) : null
  const identity =
    soleIssuer && renderIssuerRow
      ? // Collapsed single-issuer row: wrap the identity so it gets the context menu. ownsTouchable=false — the shell
        // keeps the tap; menuControl shares this component's open-state so the shell's onParentLongPress and the web
        // `…`/right-click all drive the same controlled menu.
        renderIssuerRow({
          issuer: soleIssuer,
          isRowFocused: isParentRowFocused,
          onPress: () => onParentPress?.(),
          ownsTouchable: false,
          menuControl: { isOpen: isMenuOpen, openMenu, closeMenu },
          // Embed the right-edge content in the row body so the row renders it BEFORE the hover `…` (flush right). The
          // shell omits its own copy for this path (below) to avoid a duplicate; embedding here also keeps it visible
          // while the menu's currency is still resolving.
          children: (
            <Flex row alignItems="center" gap="$spacing8" width="100%" minWidth={0}>
              <Flex flex={1} minWidth={0}>
                {soleIssuerIdentity}
              </Flex>
              {rightCategoryTag}
              {rightElement}
            </Flex>
          ),
        })
      : (soleIssuerIdentity ?? (
          <ExpandableParentAssetIdentity
            asset={asset}
            enabledChainIds={enabledChainIds}
            canExpand={canExpand}
            isExpanded={isExpanded}
            variant="search"
            chainFilter={chainFilter}
            categoryTag={titleCategoryTag}
            showNetworkCount={showIssuerStats}
            // Mobile rows are too narrow for count + volume + chevron; the expanded sub-rows still show volume.
            volumeDetail={isMobileApp ? undefined : volumeDetail}
            inlineChevron={isTitlePlacement}
          />
        ))

  // The identity flexes (minWidth 0) so it truncates instead of pushing the right edge off the row. The menu row
  // embeds its own right-edge content (above), so it's omitted here.
  const headerChildren = (
    <>
      <Flex flex={1} minWidth={0}>
        {identity}
      </Flex>
      {usesMenuRow ? null : rightCategoryTag}
      {usesMenuRow ? null : rightElement}
      {rightChevron}
    </>
  )

  // The row structure and (on web) the expand/collapse animation live in the platform-split
  // ExpandableSearchRowContainer. ExpandableAssetGroup owns the header (identity + right edge) and the
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
          chainFilter={chainFilter}
          renderIssuerRow={renderIssuerRow}
          getIssuerHref={getIssuerHref}
          showIssuerStats={showIssuerStats}
          showIssuerTag={showIssuerTag}
          onIssuerPress={onIssuerPress}
          onIssuerModifierPress={onIssuerModifierPress}
        />
      }
      issuerPanelHeightPx={getExpandableIssuerPanelHeightPx({ issuerCount, variant: 'search' })}
      focusedRowControl={focusedRowControl}
      testID={testID}
      parentHref={parentHref}
      onToggle={onToggle}
      onParentPress={onParentPress}
      onParentLongPress={
        soleIssuer && renderIssuerRow && isIssuerMenuReady?.(soleIssuer)
          ? async (): Promise<void> => {
              // Dismiss the search keyboard (else the Portal menu mis-positions) + fire the success haptic before
              // opening the controlled menu. Lives here (not in the row) because this long-press is the shell's.
              // Gated on isIssuerMenuReady so we never latch the menu open while the row is still menu-less (its
              // CurrencyInfo unresolved) — otherwise it would pop open on its own once the batched query lands.
              dismissNativeKeyboard()
              await hapticFeedback.success()
              openMenu()
            }
          : undefined
      }
    />
  )
}
