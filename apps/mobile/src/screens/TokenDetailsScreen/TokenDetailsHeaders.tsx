import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { Flex, Text } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import {
  TokenMenuActionType,
  useTokenContextMenuOptions,
} from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const HeaderTitleElement = memo(function HeaderTitleElement(): JSX.Element {
  const { t } = useTranslation()

  const { currencyId } = useTokenDetailsContext()

  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const isMultichainToken = multichainTokenUxEnabled && isMultichainProjectTokens(project?.tokens)

  const logo = project?.logoUrl ?? undefined
  const symbol = token.symbol
  const name = token.name
  const chain = token.chain

  return (
    <Flex alignItems="center" justifyContent="space-between" ml="$spacing32">
      <Flex centered row gap="$spacing4">
        <TokenLogo
          chainId={fromGraphQLChain(chain) ?? undefined}
          hideNetworkLogo={isMultichainToken}
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

export const HeaderRightElement = memo(function HeaderRightElement(): JSX.Element {
  const {
    currencyId,
    currencyInfo,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    copyAddressToClipboard,
  } = useTokenDetailsContext()
  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const isMultichainToken = multichainTokenUxEnabled && (project?.tokens?.length ?? 0) > 1

  const openReportTokenModal = useEvent(() => {
    setTimeout(() => {
      navigate(ModalName.ReportTokenIssue, {
        source: 'token-details',
        currency: currencyInfo?.currency,
        isMarkedSpam: currencyInfo?.isSpam,
        isMultichainAsset: isMultichainToken,
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
    if (!isMultichainToken) {
      return undefined
    }
    return (): void => {
      closeMenu()
      openMultichainAddressSheet()
    }
  }, [isMultichainToken, closeMenu, openMultichainAddressSheet])

  const menuActions = useTokenContextMenuOptions({
    excludedActions: EXCLUDED_ACTIONS,
    currencyId,
    isBlocked: currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: currencyInfo?.currency.symbol,
    portfolioBalance: currentChainBalance,
    isMultichainAsset: isMultichainToken,
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
