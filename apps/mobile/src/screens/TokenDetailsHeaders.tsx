import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { Flex, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TokenMenuActionType } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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

export const HeaderRightElement = memo(function HeaderRightElement(): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { currencyId, currencyInfo, openContractAddressExplainerModal, copyAddressToClipboard } =
    useTokenDetailsContext()

  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  // Should be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()

  const ellipsisElement = (
    <Flex
      hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
      style={{ padding: spacing.spacing8 }}
      testID={TestID.TokenDetailsMoreButton}
    >
      <Ellipsis color={ellipsisColor} size="$icon.16" />
    </Flex>
  )

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing12">
      {currentChainBalance ? (
        <TokenBalanceItemContextMenu
          portfolioBalance={currentChainBalance}
          excludedActions={EXCLUDED_ACTIONS}
          openContractAddressExplainerModal={openContractAddressExplainerModal}
          copyAddressToClipboard={copyAddressToClipboard}
        >
          {ellipsisElement}
        </TokenBalanceItemContextMenu>
      ) : (
        ellipsisElement
      )}
      <TokenDetailsFavoriteButton currencyId={currencyId} tokenName={currencyInfo?.currency.name} />
    </AnimatedFlex>
  )
})
