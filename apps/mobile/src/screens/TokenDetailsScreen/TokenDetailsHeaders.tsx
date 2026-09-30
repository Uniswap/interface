import { Flex, Text, iconSizes, spacing } from '@universe/mycelium'
import { TestID } from '@universe/test'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { Ellipsis } from 'ui/src/components/icons'
import { Lock } from 'ui/src/components/icons/Lock'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import {
  TokenMenuActionType,
  useTokenContextMenuOptions,
} from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const HeaderTitleElement = memo(function HeaderTitleElement(): JSX.Element {
  const { t } = useTranslation()

  const { currencyId, isPermissioned, isAllowlisted, chainId, hasMultichainAddresses, initialIsMultichainAsset } =
    useTokenDetailsContext()
  const metadata = useTokenMetadata(currencyId)

  const logo = metadata.logoUrl ?? undefined
  const symbol = metadata.symbol
  const name = metadata.name
  // Mirror the top-of-page ticker lock in the sticky header: allowlisted-only.
  const showPermissionedLock = isPermissioned && isAllowlisted

  return (
    <Flex alignItems="center" justifyContent="space-between" ml="$spacing32">
      <Flex centered row gap="$spacing4">
        <TokenLogo
          chainId={chainId}
          hideNetworkLogo={initialIsMultichainAsset || hasMultichainAddresses}
          name={name}
          size={iconSizes.icon16}
          symbol={symbol ?? undefined}
          url={logo}
        />
        <Text color="$neutral2" numberOfLines={1} variant="buttonLabel3">
          {symbol ?? t('token.error.unknown')}
        </Text>
        {showPermissionedLock && <Lock color="$neutral2" size="$icon.16" flexShrink={0} />}
      </Flex>
    </Flex>
  )
})

const EXCLUDED_ACTIONS = [
  TokenMenuActionType.Swap,
  TokenMenuActionType.Send,
  TokenMenuActionType.Receive,
  TokenMenuActionType.ViewDetails,
]

export const HeaderRightElement = memo(function HeaderRightElement(): JSX.Element {
  const {
    currencyId,
    currencyInfo,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    copyAddressToClipboard,
    hasMultichainAddresses,
  } = useTokenDetailsContext()
  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const openReportTokenModal = useEvent(() => {
    setTimeout(() => {
      navigate(ModalName.ReportTokenIssue, {
        source: 'token-details',
        currency: currencyInfo?.currency,
        isMarkedSpam: currencyInfo?.isSpam,
        isMultichainAsset: hasMultichainAddresses,
      })
    }, MODAL_OPEN_WAIT_TIME)
  })

  const openReportDataIssueModal = useEvent(() => {
    setTimeout(() => {
      navigate(ModalName.ReportTokenData, { currency: currencyInfo?.currency, isMarkedSpam: currencyInfo?.isSpam })
    }, MODAL_OPEN_WAIT_TIME)
  })

  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const onPressCopyAddressOverride = useMemo(() => {
    if (!hasMultichainAddresses) {
      return undefined
    }
    return (): void => {
      closeMenu()
      openMultichainAddressSheet()
    }
  }, [hasMultichainAddresses, closeMenu, openMultichainAddressSheet])

  const menuActions = useTokenContextMenuOptions({
    excludedActions: EXCLUDED_ACTIONS,
    currencyId,
    isBlocked: currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: currencyInfo?.currency.symbol,
    portfolioBalance: currentChainBalance,
    isMultichainAsset: hasMultichainAddresses,
    openContractAddressExplainerModal,
    openReportDataIssueModal,
    openReportTokenModal,
    copyAddressToClipboard,
    onPressCopyAddressOverride,
    // No-op: only Swap/Send handlers use closeMenu, and both are in EXCLUDED_ACTIONS
    closeMenu: () => {},
  })

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing12">
      <ContextMenu
        trackItemClicks
        menuItems={menuActions}
        triggerMode={ContextMenuTriggerMode.Primary}
        isOpen={isOpen}
        openMenu={openMenu}
        closeMenu={closeMenu}
        elementName={ElementName.TokenDetailsContextMenu}
        sectionName={SectionName.TokenDetails}
      >
        <Flex
          hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
          style={{ padding: spacing.spacing8 }}
          testID={TestID.TokenDetailsMoreButton}
        >
          <Ellipsis color="$neutral2" size="$icon.16" />
        </Flex>
      </ContextMenu>
      <TokenDetailsFavoriteButton currencyId={currencyId} tokenName={currencyInfo?.currency.name} />
    </AnimatedFlex>
  )
})
