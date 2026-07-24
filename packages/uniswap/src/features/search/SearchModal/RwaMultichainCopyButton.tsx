import { isWebPlatform } from '@universe/environment'
import React, { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import {
  TokenContextMenuAction,
  useSearchTokenMenuItems,
} from 'uniswap/src/components/lists/items/tokens/useSearchTokenMenuItems'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import type { ContextMenuHandle, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenuTriggerButton } from 'uniswap/src/components/menus/ContextMenuTriggerButton'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { MultichainAddressTransitionPanel } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressTransitionPanel'
import { useMultichainAddressViewState } from 'uniswap/src/components/MultichainTokenDetails/useMultichainAddressViewState'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { COPY_CLOSE_DELAY } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// Primary-chain action set for a multichain RWA issuer's … — Copy is rendered separately (with the fan-out
// chevron), so it is intentionally NOT in this list, and Favorite is omitted. A dedicated const, rather than a
// filter of a shared actions array, keeps this web-only button decoupled from other menus' action lists.
const RWA_MULTICHAIN_ACTIONS: TokenContextMenuAction[] = [
  TokenContextMenuAction.Swap,
  TokenContextMenuAction.Send,
  TokenContextMenuAction.Receive,
  TokenContextMenuAction.Share,
]

interface RwaMultichainCopyButtonProps {
  /** Resolved PRIMARY-chain CurrencyInfo. Drives Swap/Send/Receive/Share + Copy label. */
  primaryCurrencyInfo: CurrencyInfo
  /** RAW per-chain entries from the issuer's chainTokens (already ordered + filtered by the caller). length > 1. */
  orderedEntries: MultichainTokenEntry[]
  isVisible?: boolean
}

/**
 * Web-only `…` for a MULTICHAIN RWA issuer row: the primary-chain action set, with the Copy row fanning out to a
 * per-chain address sub-view. Works directly off the raw per-chain entries — it does NOT resolve every chain,
 * synthesize an aggregate token, or subscribe to portfolio balances. Single-chain issuers use
 * TokenRowContextMenuButton instead (RwaIssuerRow picks). Share targets the PRIMARY-chain TDP (no shareCurrencyInfo),
 * unlike regular multichain tokens which share the aggregate TDP — this matches the row's navigation.
 */
function RwaMultichainCopyButtonInner(
  { primaryCurrencyInfo, orderedEntries, isVisible = true }: RwaMultichainCopyButtonProps,
  ref: React.ForwardedRef<ContextMenuHandle>,
): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const trace = useTrace()

  const { value: isOpen, setTrue: openMenu, setFalse: rawCloseMenu } = useBooleanState(false)
  const { viewIndex, animationType, goToAddresses, goBack, resetView } = useMultichainAddressViewState()
  // Copy on a multichain issuer flips to the addresses panel; skipNextClose holds the menu open across the single
  // handleCloseMenu the Copy MenuOptionItem fires during that flip.
  const skipNextClose = useRef(false)
  // No unmount clearTimeout: in React 19 a post-unmount setState is a silent no-op, and the timer is armed only for
  // 500ms immediately after an explicit per-chain copy.
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCloseMenu = useEvent(() => {
    clearTimeout(timerRef.current)
    rawCloseMenu()
    resetView()
  })

  useDelayedMenuClose({ isVisible, isOpen, closeMenu: handleCloseMenu })

  const handleContentClose = useEvent(() => {
    if (skipNextClose.current) {
      skipNextClose.current = false
      return
    }
    handleCloseMenu()
  })

  // RWAs are always multichain here (caller gates orderedEntries.length > 1) → Copy always fans out.
  const onCopyAddressPress = useEvent((): void => {
    skipNextClose.current = true
    goToAddresses()
  })

  const onCopyMultichainAddress = useEvent(async (address: string, chainId: UniverseChainId): Promise<void> => {
    await setClipboard(address)
    if (!isWebPlatform) {
      dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
    }
    sendAnalyticsEvent(UniswapEventName.ContextMenuItemClicked, {
      ...trace,
      element: ElementName.SearchTokenContextMenu,
      section: SectionName.NavbarSearch,
      menu_item: 'Multichain Copy Address',
      menu_item_index: -1,
      chain_name: getChainInfo(chainId).urlParam,
    })
    timerRef.current = setTimeout(handleCloseMenu, COPY_CLOSE_DELAY)
  })

  const { menuItems: actionItems } = useSearchTokenMenuItems({
    currency: primaryCurrencyInfo.currency,
    closeMenu: handleCloseMenu,
    actions: RWA_MULTICHAIN_ACTIONS,
    // shareCurrencyInfo intentionally omitted → Share targets the primary-chain TDP (matches the row's navigation).
  })

  const allMenuItems = useMemo<MenuOptionItem[]>(() => {
    const copyItem: MenuOptionItem = {
      onPress: onCopyAddressPress,
      // RWAs are ERC-20 on every chain → never disabled; no inline copied-checkmark; Copy always fans out.
      disabled: false,
      label: t('common.copy.address'),
      Icon: CopyAlt,
      iconColor: '$neutral2',
      trailingIcon: <RotatableChevron direction="right" color="$neutral3" size="$icon.16" />,
    }
    return [copyItem, ...actionItems]
  }, [onCopyAddressPress, t, actionItems])

  // contentOverride bypasses ContextMenu's default MenuContent, so analytics props go on MenuContent directly.
  const contentOverride = useMemo(
    () => (
      <MultichainAddressTransitionPanel
        viewIndex={viewIndex}
        animationType={animationType}
        orderedEntries={orderedEntries}
        title={t('common.copy.address')}
        onCopyAddress={onCopyMultichainAddress}
        onBack={goBack}
      >
        <MenuContent
          trackItemClicks
          items={allMenuItems}
          handleCloseMenu={handleContentClose}
          elementName={ElementName.SearchTokenContextMenu}
          sectionName={SectionName.NavbarSearch}
        />
      </MultichainAddressTransitionPanel>
    ),
    [viewIndex, animationType, allMenuItems, handleContentClose, orderedEntries, onCopyMultichainAddress, goBack, t],
  )

  // Web-only: MultichainContextMenuAddressSubview (via MultichainAddressTransitionPanel) uses a <div> (crashes on native). Native uses MultichainAddressSheet.
  if (!isWebPlatform) {
    return null
  }

  const shouldShow = isVisible || isOpen

  return (
    <Flex opacity={shouldShow ? 1 : 0} pointerEvents={shouldShow ? 'auto' : 'none'}>
      <ContextMenu
        ref={ref}
        menuItems={[]}
        contentOverride={contentOverride}
        triggerMode={ContextMenuTriggerMode.Primary}
        isOpen={isOpen}
        closeMenu={handleCloseMenu}
        openMenu={openMenu}
        offsetY={4}
        elementName={ElementName.SearchTokenContextMenu}
        sectionName={SectionName.NavbarSearch}
      >
        <ContextMenuTriggerButton />
      </ContextMenu>
    </Flex>
  )
}

export const RwaMultichainCopyButton = React.memo(React.forwardRef(RwaMultichainCopyButtonInner))
