import { isHoverable, isMobileApp, isMobileWeb, isWebPlatform } from '@universe/environment'
import { useMemo, useState } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import {
  CONTEXT_MENU_ACTIONS,
  TokenContextMenuVariant,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { MultichainAddressSheet } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { ChainToken } from 'uniswap/src/data/rest/rwa/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { RwaMultichainCopyButton } from 'uniswap/src/features/search/SearchModal/RwaMultichainCopyButton'
import { TokenRowContextMenuButton } from 'uniswap/src/features/search/SearchModal/TokenRowContextMenuButton'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

// Shares the render-prop arg contract (isRowFocused/onPress/ownsTouchable/menuControl/children) with the seam it's
// rendered from — minus `issuer` (the factory consumes it to resolve the fields below) plus the two row-only fields.
export type RwaIssuerRowProps = Omit<RenderIssuerRowArgs, 'issuer'> & {
  /** Resolved primary-chain CurrencyInfo. Undefined → render the plain row, no menu. */
  currencyInfo?: CurrencyInfo
  /** Raw per-chain deployments for the issuer. When ≥2 supported chains, "Copy address" fans out to a per-chain
   *  picker (web: RwaMultichainCopyButton; mobile: MultichainAddressSheet). Single chain or undefined →
   *  single-address Copy. RWAs are ERC-20 on every chain → entries are never native. */
  issuerChainTokens?: ChainToken[]
}

// Not memo()'d: the parent passes a fresh `children` element + `onPress` (+ `menuControl`) every render, so a
// shallow-prop memo could never bail; the render is cheap + bounded (≤3 shelf rows + one expanded collection).
export function RwaIssuerRow({
  isRowFocused,
  onPress,
  ownsTouchable,
  currencyInfo,
  issuerChainTokens,
  menuControl,
  children,
  modifierPressHref,
  onModifierPress,
}: RwaIssuerRowProps): JSX.Element {
  const { value: internalIsOpen, setTrue: openInternalMenu, setFalse: closeInternalMenu } = useBooleanState(false)
  // A SECOND boolean state for the per-chain address sheet (mobile). Independent of the menu's open-state
  // (internal/menuControl) — closing one does not close the other; the override chains them.
  const { value: isAddressSheetOpen, setTrue: openAddressSheet, setFalse: closeAddressSheet } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()
  // Real per-row hover (web): without it `isVisible` is permanently false and useDelayedMenuClose auto-dismisses the
  // just-opened … menu (`!isVisible && isOpen` → 300ms close timer that never clears). Use the raw onMouseEnter/Leave
  // DOM props (the same hover props OptionItem wires for its row) — Tamagui's onHoverIn did NOT reliably fire here.
  const [isHovered, setIsHovered] = useState(false)
  const isOpen = menuControl?.isOpen ?? internalIsOpen
  const openMenu = menuControl?.openMenu ?? openInternalMenu
  const closeMenu = menuControl?.closeMenu ?? closeInternalMenu
  const isVisible = isRowFocused || isHovered

  // Raw entries from the issuer's chainTokens. RWAs are ERC-20 on every chain → isNative is always false, so the
  // multichain-only Copy gate below needs no all-native check. toSupportedChainId drops UNSUPPORTED chains (absent
  // from ALL_CHAIN_IDS), not user-disabled ones — enabled-chain scoping happens server-side in the ListRwas query.
  // rawEntries may recompute when issuerChainTokens churns, but useOrderedMultichainEntries collapses it to a
  // referentially-stable, mainnet-first orderedEntries, which is what every downstream consumer reads.
  const rawEntries = useMemo<MultichainTokenEntry[]>(() => {
    const entries: MultichainTokenEntry[] = []
    for (const ct of issuerChainTokens ?? []) {
      const chainId = toSupportedChainId(ct.chainId)
      if (chainId) {
        entries.push({ chainId, address: ct.address, isNative: false })
      }
    }
    return entries
  }, [issuerChainTokens])
  const orderedEntries = useOrderedMultichainEntries(rawEntries)
  const hasMultipleChains = orderedEntries.length > 1

  // Forward openMenu ONLY on web. On native, forwarding it makes ContextMenu.native add its OWN long-press
  // TouchableArea around ours (nested-touchable collision); native drives open via the touchables below.
  const forwardedOpenMenu = isWebPlatform ? openMenu : undefined

  // Native long-press affordances: dismiss the search keyboard (else the Portal menu mis-positions) + fire the
  // success haptic (else native opens silently — ContextMenu.native's own haptic touchable is bypassed once we stop
  // forwarding openMenu on native).
  const openMenuNative = async (): Promise<void> => {
    dismissNativeKeyboard()
    await hapticFeedback.success()
    openMenu()
  }

  // Mobile per-chain Copy: replace the menu's Copy action with one that opens the address sheet. closeMenu routes
  // through menuControl?.closeMenu ?? internal.setFalse, so this composes with the controlled-menu (collapsed) path.
  // Gated to multichain only.
  const copyAddressOverride = useMemo(() => {
    if (!(isMobileApp || isMobileWeb) || !hasMultipleChains) {
      return undefined
    }
    return {
      onPress: (): void => {
        closeMenu()
        openAddressSheet()
      },
    }
    // closeMenu (=menuControl.closeMenu on the collapsed path, closeInternalMenu otherwise) and openAddressSheet
    // are useCallback-stable; keep menuControl.closeMenu a bare setFalse reference to preserve this.
  }, [hasMultipleChains, closeMenu, openAddressSheet])

  if (!currencyInfo) {
    // No menu: expanded sub-row still needs its own tap target; collapsed row's tap is the shell's.
    return ownsTouchable ? (
      <TouchableArea modifierPressHref={modifierPressHref} onModifierPress={onModifierPress} onPress={onPress}>
        {children}
      </TouchableArea>
    ) : (
      <>{children}</>
    )
  }

  // Reveal via the hover signal (the repo-wide isVisible||isOpen contract), which also works on the collapsed shelf
  // row — it has no group="item" ancestor, so a CSS group-hover would not fire there.
  // Web …: multichain issuers get the per-chain Copy button; single-chain gets the standard context-menu button.
  const trailingButton = isHoverable ? (
    <Flex flexShrink={0}>
      {hasMultipleChains ? (
        <RwaMultichainCopyButton
          primaryCurrencyInfo={currencyInfo}
          orderedEntries={orderedEntries}
          isVisible={isVisible}
        />
      ) : (
        <TokenRowContextMenuButton currency={currencyInfo.currency} isVisible={isVisible} />
      )}
    </Flex>
  ) : null

  const body = (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      width="100%"
      minWidth={0}
      {...(isHoverable ? { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) } : {})}
    >
      <Flex flex={1} minWidth={0}>
        {children}
      </Flex>
      {trailingButton}
    </Flex>
  )

  return (
    <>
      <TokenOptionItemContextMenu
        // Pass triggerMode={Secondary} (== the prop's default) + openMenu={forwardedOpenMenu} explicitly: the web
        // …/right-click split drives the menu open via openMenu (web-only; undefined on native).
        actions={CONTEXT_MENU_ACTIONS[TokenContextMenuVariant.Search]}
        currency={currencyInfo.currency}
        isOpen={isOpen}
        openMenu={forwardedOpenMenu}
        closeMenu={closeMenu}
        triggerMode={ContextMenuTriggerMode.Secondary}
        copyAddressOverride={copyAddressOverride}
      >
        {isWebPlatform ? (
          // oxlint-disable-next-line react/forbid-elements -- raw div needed for the onContextMenu right-click trigger
          <div
            onContextMenu={(e): void => {
              e.preventDefault()
              openMenu()
            }}
          >
            {ownsTouchable ? (
              <TouchableArea modifierPressHref={modifierPressHref} onModifierPress={onModifierPress} onPress={onPress}>
                {body}
              </TouchableArea>
            ) : (
              body
            )}
          </div>
        ) : ownsTouchable ? (
          // native expanded sub-row: ONE TouchableArea, tap + long-press (no nesting, no `…` since !isHoverable).
          // openMenuNative adds keyboard-dismiss + haptic.
          <TouchableArea
            modifierPressHref={modifierPressHref}
            onModifierPress={onModifierPress}
            onPress={onPress}
            onLongPress={openMenuNative}
          >
            {body}
          </TouchableArea>
        ) : (
          // native collapsed row: shell owns the tap; its onLongPress drives the CONTROLLED menuControl.openMenu,
          // so this mounted (controlled) wrapper shows the menu on long-press. No inner touchable (no nesting).
          children
        )}
      </TokenOptionItemContextMenu>
      {/* Sheet lives ONLY on the resolved-currency path. The !currencyInfo early-return (above) is intentionally
          menu- and sheet-less: with no menu mounted, copyAddressOverride can never fire, so addressSheet stays closed
          — keep this mount below that guard (a hoist above it would mount an inert, always-null sheet). */}
      {(isMobileApp || isMobileWeb) && hasMultipleChains && (
        <MultichainAddressSheet isOpen={isAddressSheetOpen} chains={orderedEntries} onClose={closeAddressSheet} />
      )}
    </>
  )
}
