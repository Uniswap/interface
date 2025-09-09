import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { Flex, GeneratedIcon, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import {
  CoinConvert,
  CopyAlt,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  ReceiveAlt,
  SendAction,
  ShareArrow,
} from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { TokenMenuActionType, useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

export const HeaderTitleElement = memo(function HeaderTitleElement(): JSX.Element {
  const { t } = useTranslation()

  const { currencyId } = useTokenDetailsContext()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const logo = project?.logoUrl ?? undefined
  const symbol = token.symbol
  const name = token.name
  const chain = token.chain

  return (
    <Flex alignItems="center" justifyContent="space-between" ml="$spacing32">
      <Flex centered row gap="$spacing4">
        <TokenLogo
          chainId={fromGraphQLChain(chain) ?? undefined}
          name={name}
          size={iconSizes.icon16}
          symbol={symbol ?? undefined}
          url={logo}
        />
        <Text color="$neutral2" numberOfLines={1} variant="buttonLabel3">
          {symbol ?? t('token.error.unknown')}
        </Text>
      </Flex>
    </Flex>
  )
})

const EXCLUDED_ACTIONS = [TokenMenuActionType.Swap, TokenMenuActionType.Send, TokenMenuActionType.Receive]

// TODO:(WALL-6032) store with actions in `useTokenContextMenu` after migrating `TokenBalanceList`
const getActionTypeToMobileIcon = (isTokenVisible: boolean): Record<TokenMenuActionType, GeneratedIcon> => ({
  [TokenMenuActionType.CopyAddress]: CopyAlt,
  [TokenMenuActionType.Receive]: ReceiveAlt,
  [TokenMenuActionType.Send]: SendAction,
  [TokenMenuActionType.Share]: ShareArrow,
  [TokenMenuActionType.Swap]: CoinConvert,
  [TokenMenuActionType.ToggleVisibility]: isTokenVisible ? EyeOff : Eye,
  [TokenMenuActionType.ViewDetails]: ExternalLink,
})

export const HeaderRightElement = memo(function HeaderRightElement(): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { currencyId, currencyInfo, openContractAddressExplainerModal, copyAddressToClipboard } =
    useTokenDetailsContext()

  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const isBlocked = currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const { value: isMenuOpen, setFalse: closeMenu, setTrue: openMenu } = useBooleanState(false)
  const { menuActions, isVisible } = useTokenContextMenu({
    currencyId,
    isBlocked,
    excludedActions: EXCLUDED_ACTIONS,
    tokenSymbolForNotification: currencyInfo?.currency.symbol,
    portfolioBalance: currentChainBalance,
    openContractAddressExplainerModal,
    copyAddressToClipboard,
  })

  // Should be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()

  const actionsWithIcons: MenuOptionItem[] = useMemo(() => {
    const actionTypeToIcon = getActionTypeToMobileIcon(isVisible)

    return menuActions.map((action): MenuOptionItem => {
      return {
        ...action,
        label: action.title,
        Icon: actionTypeToIcon[action.name],
        textColor: action.destructive ? colors.statusCritical.val : undefined,
        iconColor: action.destructive ? colors.statusCritical.val : colors.neutral2.val,
      }
    })
  }, [isVisible, menuActions, colors.statusCritical.val, colors.neutral2.val])

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing12">
      <ContextMenu
        menuItems={actionsWithIcons}
        triggerMode={ContextMenuTriggerMode.Primary}
        isOpen={isMenuOpen}
        openMenu={openMenu}
        closeMenu={closeMenu}
        onPressAny={(e) => {
          sendAnalyticsEvent(MobileEventName.TokenDetailsContextMenuAction, {
            action: e.name,
          })
        }}
      >
        <Flex
          hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
          style={{ padding: spacing.spacing8 }}
          testID={TestID.TokenDetailsMoreButton}
        >
          <Ellipsis color={ellipsisColor} size="$icon.16" />
        </Flex>
      </ContextMenu>
      <TokenDetailsFavoriteButton currencyId={currencyId} tokenName={currencyInfo?.currency.name} />
    </AnimatedFlex>
  )
})
