import { isWebPlatform } from '@universe/environment'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
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
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { COPY_CLOSE_DELAY } from 'uniswap/src/constants/misc'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { TDPView } from 'uniswap/src/utils/linking'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MULTICHAIN_ACTIONS: TokenContextMenuAction[] = [
  TokenContextMenuAction.Swap,
  TokenContextMenuAction.Send,
  TokenContextMenuAction.Receive,
  TokenContextMenuAction.Share,
]

function useBestChainCurrencyInfo(tokens: CurrencyInfo[], fallback: CurrencyInfo): CurrencyInfo {
  const evmAddress = useActiveAddress(Platform.EVM)
  const svmAddress = useActiveAddress(Platform.SVM)
  const { data: balancesById } = usePortfolioBalances({ evmAddress, svmAddress })

  return useMemo(() => {
    const mainnetToken = tokens.find((t) => t.currency.chainId === UniverseChainId.Mainnet)
    const defaultToken = mainnetToken ?? fallback

    if (!balancesById || tokens.length === 0) {
      return defaultToken
    }

    let bestToken: CurrencyInfo | undefined
    let bestBalance = -1

    for (const token of tokens) {
      const balance = balancesById[token.currencyId]
      const usd = balance?.balanceUSD ?? 0
      if (usd > bestBalance) {
        bestBalance = usd
        bestToken = token
      }
    }

    return bestBalance > 0 && bestToken ? bestToken : defaultToken
  }, [balancesById, tokens, fallback])
}

function useMultichainEntries(tokens: CurrencyInfo[]): MultichainTokenEntry[] {
  const entries = useMemo<MultichainTokenEntry[]>(
    () =>
      tokens.map((ci) => ({
        chainId: ci.currency.chainId,
        address: currencyAddress(ci.currency),
        isNative: ci.currency.isNative,
      })),
    [tokens],
  )
  return useOrderedMultichainEntries(entries)
}

interface MultichainTokenContextMenuButtonProps {
  tokens: CurrencyInfo[]
  primaryCurrencyInfo: CurrencyInfo
  isVisible?: boolean
}

function MultichainTokenContextMenuButtonInner(
  { tokens, primaryCurrencyInfo, isVisible = true }: MultichainTokenContextMenuButtonProps,
  ref: React.ForwardedRef<ContextMenuHandle>,
): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const trace = useTrace()

  const { value: isOpen, setTrue: openMenu, setFalse: rawCloseMenu } = useBooleanState(false)
  const { viewIndex, animationType, goToAddresses, goBack, resetView } = useMultichainAddressViewState()
  const [copiedAddress, setCopiedAddress] = useState(false)
  // When "Copy address" transitions to the addresses sub-view, DropdownMenuSheetItem
  // fires handleCloseMenu. skipNextClose prevents that single close from dismissing
  // the menu, keeping it open while the view changes.
  const skipNextClose = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const isSingleChain = tokens.length <= 1
  const bestCurrency = useBestChainCurrencyInfo(tokens, primaryCurrencyInfo)
  const orderedEntries = useMultichainEntries(tokens)
  const allNative = orderedEntries.every((e) => e.isNative)

  const handleCloseMenu = useCallback(() => {
    clearTimeout(timerRef.current)
    rawCloseMenu()
    resetView()
    setCopiedAddress(false)
  }, [rawCloseMenu, resetView])

  useDelayedMenuClose({ isVisible, isOpen, closeMenu: handleCloseMenu })

  const handleContentClose = useCallback(() => {
    if (skipNextClose.current) {
      skipNextClose.current = false
      return
    }
    handleCloseMenu()
  }, [handleCloseMenu])

  const onCopyAddressPress = useCallback(async (): Promise<void> => {
    if (isSingleChain) {
      await setClipboard(currencyAddress(primaryCurrencyInfo.currency))
      if (!isWebPlatform) {
        dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
      }
      setCopiedAddress(true)
      timerRef.current = setTimeout(() => setCopiedAddress(false), COPY_CLOSE_DELAY)
    } else {
      skipNextClose.current = true
      goToAddresses()
    }
  }, [isSingleChain, primaryCurrencyInfo.currency, dispatch, goToAddresses])

  const onCopyMultichainAddress = useCallback(
    async (address: string, chainId: UniverseChainId): Promise<void> => {
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
    },
    [dispatch, handleCloseMenu, trace],
  )

  const { menuItems: actionItems } = useSearchTokenMenuItems({
    currency: bestCurrency.currency,
    closeMenu: handleCloseMenu,
    actions: MULTICHAIN_ACTIONS,
    shareCurrencyInfo: {
      currencyId: primaryCurrencyInfo.currencyId,
      chainId: primaryCurrencyInfo.currency.chainId,
      tdpView: isSingleChain ? TDPView.Chain : TDPView.Aggregate,
    },
  })

  const allMenuItems = useMemo(() => {
    const isCopyDisabled = isSingleChain ? primaryCurrencyInfo.currency.isNative : allNative
    const copyItem: MenuOptionItem = {
      onPress: onCopyAddressPress,
      disabled: isCopyDisabled,
      label: copiedAddress ? t('common.copied') : t('common.copy.address'),
      Icon: copiedAddress ? CheckCircleFilled : CopyAlt,
      closeDelay: isSingleChain ? COPY_CLOSE_DELAY : undefined,
      iconColor: copiedAddress ? '$statusSuccess' : '$neutral2',
      trailingIcon:
        !isSingleChain && !allNative ? (
          <RotatableChevron direction="right" color="$neutral3" size="$icon.16" />
        ) : undefined,
    }
    return [copyItem, ...actionItems]
  }, [
    onCopyAddressPress,
    isSingleChain,
    primaryCurrencyInfo.currency.isNative,
    copiedAddress,
    t,
    actionItems,
    allNative,
  ])

  // Analytics props (trackItemClicks, elementName, sectionName) are passed directly to
  // MenuContent here because contentOverride bypasses ContextMenu's default MenuContent.
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

  // Web-only: the menu content above uses <div> for event propagation control, which crashes on native.
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

export const MultichainTokenContextMenuButton = React.memo(React.forwardRef(MultichainTokenContextMenuButtonInner))
