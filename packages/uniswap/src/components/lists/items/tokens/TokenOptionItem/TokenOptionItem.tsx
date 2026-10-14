import { isHoverable, isMobileApp, isMobileWeb, isWebPlatform } from '@universe/environment'
import { memo, useMemo, useRef } from 'react'
import { useIsRowFocused } from 'uniswap/src/components/lists/focusedRowStore'
import { BaseTokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/BaseTokenOptionItem'
import { CONTEXT_MENU_ACTIONS } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/contextMenuActions'
import { LegacyTokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/LegacyTokenOptionItem'
import {
  isLegacyTokenOptionItemProps,
  type LegacyTokenOptionItemProps,
  type TokenOptionItemProps,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/types'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import type { ContextMenuHandle } from 'uniswap/src/components/menus/ContextMenu'
import { MultichainAddressSheet } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { MultichainTokenContextMenuButton } from 'uniswap/src/features/search/SearchModal/MultichainTokenContextMenuButton'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const TokenOptionItem = memo(function TokenOptionItemInner(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): JSX.Element {
  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { value: isAddressSheetOpen, setFalse: closeAddressSheet, setTrue: openAddressSheet } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()
  // Lets the row's right-click (below) open the same menu instance as the "…" kebab.
  const multichainButtonRef = useRef<ContextMenuHandle>(null)

  const multichainData = !isLegacyTokenOptionItemProps(props) ? props.multichainData : undefined
  const rawEntries = useMemo<MultichainTokenEntry[]>(
    () =>
      multichainData
        ? multichainData.tokens.map((ci) => ({
            chainId: ci.currency.chainId,
            address: currencyAddress(ci.currency),
            isNative: ci.currency.isNative,
          }))
        : [],
    [multichainData],
  )
  const orderedEntries = useOrderedMultichainEntries(rawEntries)
  const hasMultipleChains = orderedEntries.length > 1
  const allNative = orderedEntries.length > 0 && orderedEntries.every((e) => e.isNative)

  const hideContextMenu = !isLegacyTokenOptionItemProps(props) && props.hideContextMenu
  // Only reachable via the context menu's Copy action, so skipped when the menu is hidden.
  const showMultichainAddressSheet = (isMobileApp || isMobileWeb) && hasMultipleChains && !hideContextMenu

  const copyAddressOverride = useMemo(() => {
    if (!showMultichainAddressSheet || allNative) {
      return undefined
    }
    return {
      onPress: (): void => {
        closeContextMenu()
        openAddressSheet()
      },
    }
  }, [showMultichainAddressSheet, allNative, closeContextMenu, openAddressSheet])

  // Built internally (not passed via rightElement) so the row's right-click below can ref it.
  const hasMultichainButton = isHoverable && Boolean(multichainData) && !hideContextMenu
  const focusedRowControl = !isLegacyTokenOptionItemProps(props) ? props.focusedRowControl : undefined
  const isRowFocused = useIsRowFocused(focusedRowControl?.rowIndex)
  const isMultichainButtonVisible = focusedRowControl ? isRowFocused : undefined

  if (isLegacyTokenOptionItemProps(props)) {
    return <LegacyTokenOptionItem {...props} />
  }

  const content = hideContextMenu ? (
    <BaseTokenOptionItem {...props} />
  ) : hasMultichainButton && multichainData && isWebPlatform ? (
    // oxlint-disable-next-line react/forbid-elements -- raw div needed for the onContextMenu right-click trigger
    <div
      onContextMenu={(e): void => {
        e.preventDefault()
        multichainButtonRef.current?.openAt(e.clientX, e.clientY)
      }}
    >
      <BaseTokenOptionItem
        {...props}
        rightElement={
          <MultichainTokenContextMenuButton
            ref={multichainButtonRef}
            tokens={multichainData.tokens}
            primaryCurrencyInfo={multichainData.primaryCurrencyInfo}
            isVisible={isMultichainButtonVisible}
          />
        }
      />
    </div>
  ) : (
    <TokenOptionItemContextMenu
      actions={CONTEXT_MENU_ACTIONS[props.contextMenuVariant]}
      currency={props.option.currencyInfo.currency}
      isOpen={isContextMenuOpen}
      closeMenu={closeContextMenu}
      copyAddressOverride={copyAddressOverride}
    >
      {isWebPlatform ? (
        // oxlint-disable-next-line react/forbid-elements -- needed here
        <div
          onContextMenu={(e): void => {
            // The menu's own trigger (which prevents the native menu) mounts only after the first open, so
            // until then this is the only handler on the path.
            e.preventDefault()
            openContextMenu()
          }}
        >
          <BaseTokenOptionItem {...props} />
        </div>
      ) : (
        <BaseTokenOptionItem
          {...props}
          openContextMenu={async (): Promise<void> => {
            await hapticFeedback.success()
            openContextMenu()
          }}
        />
      )}
    </TokenOptionItemContextMenu>
  )

  return (
    <>
      {content}
      {showMultichainAddressSheet && (
        <MultichainAddressSheet isOpen={isAddressSheetOpen} chains={orderedEntries} onClose={closeAddressSheet} />
      )}
    </>
  )
})
