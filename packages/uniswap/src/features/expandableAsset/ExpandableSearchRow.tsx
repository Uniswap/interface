import { isWebPlatform } from '@universe/environment'
import { Flex, type FlexCompatProps as FlexProps, type ModifierPressProps, TouchableArea } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useIsRowFocused } from 'uniswap/src/components/lists/focusedRowStore'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'
import { noop } from 'utilities/src/react/noop'

type ExpandableSearchRowProps = ModifierPressProps & {
  /** False → the flat collapsed row; true → the `$surface2` shell with the header + panel slot. */
  showShell: boolean
  canExpand: boolean
  /** Logical expanded state (for `accessibilityState`), independent of the animation-driven `showShell`. */
  isExpanded: boolean
  onToggle: () => void
  onParentPress?: () => void
  /** Long-press of the collapsed single-issuer row → opens the row's context menu (native + mobile-web touch).
   *  Added as an interaction-only prop on the existing collapsed touchable; no layout/height change. */
  onParentLongPress?: () => void
  header: ReactNode
  /** Rendered inside the shell below the header — the issuer panel, possibly wrapped in an animation clip. */
  panelSlot: ReactNode
  /** Keyboard list-nav control (web): drives the focus highlight + Enter-to-activate, mirroring OptionItem. */
  focusedRowControl?: FocusedRowControl
  testID?: string
}

/**
 * Shared structural renderer for a search-variant grouped-RWA row, used by both the `.web` (animated) and
 * `.native` (instant) containers so the collapsed and expanded trees stay identical across platforms (the
 * native row height is force-sized by `getExpandableSearchRowHeightPx`, so structural drift would clip/gap it).
 * The shell carries no flex gap; the parent↔panel gap lives inside `panelSlot` so the web split reveals it with
 * the panel.
 */
export function ExpandableSearchRow({
  showShell,
  canExpand,
  isExpanded,
  onToggle,
  onParentPress,
  onParentLongPress,
  modifierPressHref,
  onModifierPress,
  header,
  panelSlot,
  focusedRowControl,
  testID,
}: ExpandableSearchRowProps): JSX.Element {
  // Mirror OptionItem's keyboard list-nav contract so an arrowed-to collection row shows focus and Enter
  // activates it (expand/collapse, or navigate for a single-issuer row). Web-only — native has no arrow-key nav.
  const { rowIndex, setFocusedRowIndex } = focusedRowControl ?? {}
  const keyboardNavEnabled = isWebPlatform && focusedRowControl && setFocusedRowIndex
  const isFocused = useIsRowFocused(rowIndex)
  const onActivate = canExpand ? onToggle : (onParentPress ?? noop)
  useKeyDown({
    keys: ['Enter'],
    keyAction: KeyAction.UP,
    disabled: !keyboardNavEnabled || !isFocused,
    callback: onActivate,
    shouldTriggerInInput: true,
  })
  const focusedStyleProps: FlexProps = keyboardNavEnabled
    ? {
        backgroundColor: isFocused ? '$surface1Hovered' : undefined,
        onMouseEnter: (): void => setFocusedRowIndex(rowIndex),
        onMouseLeave: (): void => setFocusedRowIndex(undefined),
      }
    : { hoverStyle: { backgroundColor: '$surface1Hovered' } }
  // The expanded header takes no highlight — the `$surface2` shell already reads as distinct — so both highlight
  // sources are dropped: `backgroundColor` on the keyboard-nav path, `hoverStyle` otherwise. The mouse handlers stay:
  // they also own the list's focus index, so dropping them would drift arrow-key focus while the cursor rests here.
  const expandedHeaderStyleProps: FlexProps = keyboardNavEnabled
    ? { onMouseEnter: focusedStyleProps.onMouseEnter, onMouseLeave: focusedStyleProps.onMouseLeave }
    : {}
  const toggleA11yProps = {
    accessibilityRole: 'button' as const,
    testID,
    // Only an expandable (multi-issuer) row carries an expanded/collapsed state.
    ...(canExpand ? { accessibilityState: { expanded: isExpanded } } : {}),
  }

  if (!showShell) {
    // Collapsed: mirror `OptionItem` (px outer + p inner + rounded + hover/focus). `minHeight` pins the row to the
    // standard sibling-row height, which also equals the expanded shell's base height so expanding only grows the
    // panel below the header (no base-height change).
    return (
      <Flex px="$spacing12" width="100%">
        <TouchableArea
          pressStyle={{ scale: 1 }}
          onPress={canExpand ? onToggle : onParentPress}
          onLongPress={onParentLongPress}
          {...(!canExpand ? { modifierPressHref, onModifierPress } : {})}
          {...toggleA11yProps}
        >
          <Flex minHeight={EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX} width="100%">
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              p="$spacing8"
              borderRadius="$rounded16"
              width="100%"
              {...focusedStyleProps}
            >
              {header}
            </Flex>
          </Flex>
        </TouchableArea>
      </Flex>
    )
  }

  // Expanded (or mid-collapse animation): `$surface2` shell inset to the same px and `minHeight` base as the
  // collapsed row. No flex gap — the parent↔panel gap lives inside `panelSlot`.
  return (
    <Flex px="$spacing12" width="100%">
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface5"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        minHeight={EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX}
        py="$spacing8"
        // 7px + the 1px border equals the collapsed row's $spacing8 horizontal inset.
        px={7}
        width="100%"
      >
        <TouchableArea pressStyle={{ scale: 1 }} onPress={onToggle} {...toggleA11yProps}>
          {/* Natural-height header (matches the collapsed row's content row) so the identity doesn't shift when
              the panel reveals below it. Carries no hover/focus highlight — see `expandedHeaderStyleProps`. */}
          <Flex
            row
            alignItems="center"
            gap="$spacing8"
            borderRadius="$rounded12"
            width="100%"
            {...expandedHeaderStyleProps}
          >
            {header}
          </Flex>
        </TouchableArea>
        {panelSlot}
      </Flex>
    </Flex>
  )
}
