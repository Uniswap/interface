import { isExtensionApp } from '@universe/environment'
import { memo, PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { COPY_CLOSE_DELAY } from 'uniswap/src/components/lists/items/tokens/useSearchTokenMenuItems'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import type { MenuOptionItemWithId } from 'uniswap/src/components/menus/ContextMenu'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { MultichainContextMenuAddressSubview } from 'uniswap/src/components/MultichainTokenDetails/MultichainContextMenuAddressSubview'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList, type CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  TokenMenuActionType,
  useTokenContextMenuOptions,
} from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type ViewState = 'actions' | 'addresses'

type TokensMultichainParentContextMenuProps = PropsWithChildren<
  TokenBalanceItemContextMenuProps & { tokenCurrencyInfos: CurrencyInfo[] }
>

export const TokensMultichainParentContextMenu = memo(function TokensMultichainParentContextMenu({
  children,
  portfolioBalance,
  tokenCurrencyInfos,
  excludedActions,
  openContractAddressExplainerModal,
  openReportTokenModal,
  openReportDataIssueModal,
  copyAddressToClipboard,
  triggerMode,
  onPressToken,
  disableNotifications,
  recipient,
}: TokensMultichainParentContextMenuProps): JSX.Element {
  const { t } = useTranslation()
  const { value: isOpen, setTrue: openMenu, setFalse: rawCloseMenu, toggle } = useBooleanState(false)
  const [viewState, setViewState] = useState<ViewState>('actions')
  const [animationType, setAnimationType] = useState<'forward' | 'backward'>('forward')
  const skipNextClose = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const isPrimaryTriggerMode =
    triggerMode === ContextMenuTriggerMode.Primary
      ? true
      : triggerMode === ContextMenuTriggerMode.Secondary
        ? false
        : isExtensionApp

  const multichainEntries = useMemo(
    () =>
      tokenCurrencyInfos.map((ci) => ({
        chainId: ci.currency.chainId,
        address: currencyAddress(ci.currency),
        isNative: ci.currency.isNative,
      })),
    [tokenCurrencyInfos],
  )
  const orderedEntries = useOrderedMultichainEntries(multichainEntries)
  const allNative = orderedEntries.length > 0 && orderedEntries.every((e) => e.isNative)

  const handleCloseMenu = useCallback(() => {
    clearTimeout(timerRef.current)
    rawCloseMenu()
    setViewState('actions')
  }, [rawCloseMenu])

  const handleContentClose = useCallback(() => {
    if (skipNextClose.current) {
      skipNextClose.current = false
      return
    }
    handleCloseMenu()
  }, [handleCloseMenu])

  const onPressCopyAddressOverride = useCallback(() => {
    skipNextClose.current = true
    setAnimationType('forward')
    setViewState('addresses')
  }, [])

  const menuActionsRaw = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    isMultichainAsset: tokenCurrencyInfos.length > 1,
    openContractAddressExplainerModal,
    openReportTokenModal,
    openReportDataIssueModal,
    copyAddressToClipboard,
    onPressCopyAddressOverride,
    closeMenu: handleCloseMenu,
    disableNotifications,
    recipient,
    multichainWithCopyAddressList: true,
    allNativeMultichain: allNative,
  })

  const menuActions = useMemo((): MenuOptionItemWithId[] => {
    return menuActionsRaw.map((action) => {
      if (action.id !== TokenMenuActionType.CopyAddress) {
        return action
      }
      return {
        ...action,
        trailingIcon: <RotatableChevron direction="right" color="$neutral3" size="$icon.16" />,
      }
    })
  }, [menuActionsRaw])

  const onCopyMultichainAddress = useCallback(
    async (address: string, _chainId: UniverseChainId): Promise<void> => {
      await copyAddressToClipboard?.(address)
      sendAnalyticsEvent(UniswapEventName.ContextMenuItemClicked, {
        element: ElementName.PortfolioTokenContextMenu,
        section: SectionName.PortfolioTokensTab,
        menu_item: 'Multichain Copy Address',
        menu_item_index: -1,
      })
      timerRef.current = setTimeout(handleCloseMenu, COPY_CLOSE_DELAY)
    },
    [copyAddressToClipboard, handleCloseMenu],
  )

  const handleBack = useCallback(() => {
    setAnimationType('backward')
    setViewState('actions')
  }, [])

  const viewIndex = viewState === 'actions' ? 0 : 1

  const contentOverride = useMemo(
    () => (
      <AnimateTransition currentIndex={viewIndex} animationType={animationType} animation="200ms">
        <MenuContent
          trackItemClicks
          items={menuActions}
          handleCloseMenu={handleContentClose}
          elementName={ElementName.PortfolioTokenContextMenu}
          sectionName={SectionName.PortfolioTokensTab}
        />
        <MultichainContextMenuAddressSubview
          orderedEntries={orderedEntries}
          title={t('common.copy.address')}
          onCopyAddress={onCopyMultichainAddress}
          onBack={handleBack}
        />
      </AnimateTransition>
    ),
    [viewIndex, animationType, menuActions, handleContentClose, orderedEntries, onCopyMultichainAddress, handleBack, t],
  )

  const ignoreDefault = useEvent((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  })

  const preventDefaultContextMenuOnly = useEvent((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
  })

  const actionableItem = useMemo(() => {
    const onInnerContextMenu = isExtensionApp
      ? isPrimaryTriggerMode
        ? ignoreDefault
        : preventDefaultContextMenuOnly
      : toggle

    return (
      // oxlint-disable-next-line react/forbid-elements -- needed here
      <div style={{ cursor: 'pointer' }} onContextMenu={onInnerContextMenu}>
        <TouchableArea
          onPressIn={(e) => e.stopPropagation()}
          onPressOut={(e) => e.stopPropagation()}
          onPress={isPrimaryTriggerMode ? toggle : onPressToken}
        >
          {children}
        </TouchableArea>
      </div>
    )
  }, [children, ignoreDefault, isPrimaryTriggerMode, onPressToken, preventDefaultContextMenuOnly, toggle])

  return (
    <ContextMenu
      trackItemClicks
      menuItems={[]}
      contentOverride={contentOverride}
      triggerMode={isPrimaryTriggerMode ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={handleCloseMenu}
      elementName={ElementName.PortfolioTokenContextMenu}
      sectionName={SectionName.PortfolioTokensTab}
    >
      {actionableItem}
    </ContextMenu>
  )
})
