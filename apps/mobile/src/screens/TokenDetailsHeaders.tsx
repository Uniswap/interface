import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn } from 'react-native-reanimated'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { TokenMenuActionType, useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

export const HeaderTitleElement = memo(function HeaderTitleElement(): JSX.Element {
  const { t } = useTranslation()

  const { currencyId } = useTokenDetailsContext()

  const token = useTokenBasicInfoPartsFragment({ currencyId })?.data
  const project = useTokenBasicProjectPartsFragment({ currencyId })?.data.project

  const logo = project?.logoUrl ?? undefined
  const symbol = token?.symbol
  const name = token?.name
  const chain = token?.chain

  return (
    <Flex alignItems="center" justifyContent="space-between" ml="$spacing32">
      <TokenPrice />

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

const TokenPrice = memo(function _TokenPrice(): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { currencyId } = useTokenDetailsContext()

  const onChainMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const offChainMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data?.project?.markets

  const price = offChainMarkets?.[0]?.price?.value || onChainMarket?.price?.value || undefined

  return (
    <Text color="$neutral1" variant="body1">
      {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
    </Text>
  )
})

const EXCLUDED_ACTIONS = [TokenMenuActionType.Swap, TokenMenuActionType.Send, TokenMenuActionType.Receive]

export const HeaderRightElement = memo(function HeaderRightElement(): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { currencyId, currencyInfo } = useTokenDetailsContext()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data?.project

  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const safetyLevel = project?.safetyLevel
  const isBlocked = safetyLevel === SafetyLevel.Blocked || currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId,
    isBlocked,
    excludedActions: EXCLUDED_ACTIONS,
    tokenSymbolForNotification: token?.symbol,
    portfolioBalance: currentChainBalance,
  })

  // Should be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing16">
      <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
        <TouchableArea
          hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
          style={{ padding: spacing.spacing8, marginRight: -spacing.spacing8 }}
          testID={TestID.TokenDetailsMoreButton}
          onLongPress={disableOnPress}
          onPress={disableOnPress}
        >
          <EllipsisIcon color={ellipsisColor} height={iconSizes.icon16} width={iconSizes.icon16} />
        </TouchableArea>
      </ContextMenu>
      <TokenDetailsFavoriteButton currencyId={currencyId} />
    </AnimatedFlex>
  )
})
