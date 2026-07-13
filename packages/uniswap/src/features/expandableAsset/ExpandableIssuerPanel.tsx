import type { ReactNode } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX,
  EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
  EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableIssuerIdentity } from 'uniswap/src/features/expandableAsset/ExpandableIssuerIdentity'
import type { ExpandableAssetGroupVariant, RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

/**
 * Inner `$surface1` block; issuer sub-rows (or table sub-row slots) render as children inside it.
 *
 * - `table` (default): keeps `gap/px/py="$spacing4"`. The table aligns issuer columns with the parent
 *   row by bleeding rows outward by `EXPANDABLE_ASSET_INNER_PADDING_X_PX` (`IssuerTableRowHoverProvider`),
 *   and sizes the expand animation via `getExpandableIssuerPanelHeightPx({ variant: 'table' })`.
 * - `search`: transparent, `$surface5`-bordered, rounded, clipped block with a 2px gap
 *   (`EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX`) between rows. Each row paints its own `$surface1` fill, so the gaps
 *   reveal the `$surface2` shell behind the panel (per Figma). Issuer rows carry their own `px="$spacing8"` indent.
 */
export function ExpandableIssuerPanelContainer({
  children,
  variant = 'table',
}: {
  children: ReactNode
  variant?: ExpandableAssetGroupVariant
}): JSX.Element {
  if (variant === 'search') {
    return (
      <Flex
        borderColor="$surface5"
        borderWidth="$spacing1"
        borderRadius="$rounded12"
        width="100%"
        gap={EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX}
        overflow="hidden"
      >
        {children}
      </Flex>
    )
  }

  return (
    <Flex
      backgroundColor="$surface1"
      borderRadius="$rounded12"
      width="100%"
      gap="$spacing4"
      px="$spacing4"
      py="$spacing4"
    >
      {children}
    </Flex>
  )
}

type ExpandableIssuerRowsProps = {
  asset: Rwa
  enabledChainIds: readonly UniverseChainId[]
  variant: ExpandableAssetGroupVariant
  onIssuerPress?: (issuer: IssuerToken) => void
  /** When set, OWNS the issuer row (a single TouchableArea: tap=navigate, long-press=menu) so there is no nested
   *  TouchableArea. Receives the navigation `onPress` + the default identity body, renders the row in place of the
   *  built-in TouchableArea. Must not add vertical extent (the row is fixed-height + overflow:hidden). Expanded
   *  sub-rows pass `isRowFocused=false` and rely on the row's own hover tracking for the `…` reveal. */
  renderIssuerRow?: (args: RenderIssuerRowArgs) => ReactNode
  getIssuerHref?: (issuer: IssuerToken) => string | undefined
  onIssuerModifierPress?: (issuer: IssuerToken) => void
}

/** Issuer sub-rows inside the inner `$surface1` container (nested under `$surface2`). */
export function ExpandableIssuerRows({
  asset,
  enabledChainIds,
  variant,
  onIssuerPress,
  renderIssuerRow,
  getIssuerHref,
  onIssuerModifierPress,
}: ExpandableIssuerRowsProps): JSX.Element {
  return (
    <ExpandableIssuerPanelContainer variant={variant}>
      {asset.issuerTokens.map((issuer) => {
        const issuerRow = (
          <ExpandableIssuerIdentity asset={asset} issuer={issuer} enabledChainIds={enabledChainIds} variant={variant} />
        )
        const onPress = (): void => onIssuerPress?.(issuer)
        const onModifierPress = (): void => onIssuerModifierPress?.(issuer)
        // Scope by ticker so a common issuer slug (e.g. "ondo") doesn't collide across collections.
        const issuerTestID =
          variant === 'search' ? `${TestID.SearchRwaIssuerPrefix}${asset.symbol}-${issuer.issuer}` : undefined

        return (
          <Flex
            key={issuer.issuer}
            group="item"
            // `stretch` (not `center`) so the row fills the panel width and left-aligns its content, like the parent
            // row. Every child here is width:100%, so `center` was a harmless horizontal no-op until a content-width
            // render-prop row exposed it. `justifyContent="center"` (the column main axis) still vertically centers
            // the content within the fixed-height row.
            alignItems="stretch"
            justifyContent="center"
            backgroundColor={variant === 'search' ? '$surface1' : undefined}
            hoverStyle={variant === 'search' ? { backgroundColor: '$surface1Hovered' } : undefined}
            height={
              variant === 'search'
                ? EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX
                : EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX
            }
            overflow="hidden"
            width="100%"
            px={variant === 'search' ? '$spacing8' : undefined}
            // renderIssuerRow owns the row's TouchableArea, so the issuer row-locator testID moves to this wrapper for
            // that path; the default-TouchableArea path below keeps it on the touchable (its accessibilityRole too).
            {...(renderIssuerRow && issuerTestID ? { testID: issuerTestID } : {})}
          >
            {renderIssuerRow ? (
              // Expanded sub-row: the row owns the single TouchableArea (tap=navigate, long-press=menu on native), so
              // pass ownsTouchable=true and let it render in place of the built-in TouchableArea. No nesting.
              renderIssuerRow({
                issuer,
                isRowFocused: false,
                onPress,
                ownsTouchable: true,
                children: issuerRow,
                modifierPressHref: getIssuerHref?.(issuer),
                onModifierPress,
              })
            ) : onIssuerPress ? (
              <TouchableArea
                width="100%"
                pressStyle={{ scale: 1 }}
                {...(variant === 'search'
                  ? {
                      accessibilityRole: 'button' as const,
                      testID: issuerTestID,
                    }
                  : {})}
                modifierPressHref={getIssuerHref?.(issuer)}
                onModifierPress={onModifierPress}
                onPress={(event) => {
                  event.stopPropagation()
                  onIssuerPress(issuer)
                }}
              >
                <Flex width="100%">{issuerRow}</Flex>
              </TouchableArea>
            ) : (
              issuerRow
            )}
          </Flex>
        )
      })}
    </ExpandableIssuerPanelContainer>
  )
}
