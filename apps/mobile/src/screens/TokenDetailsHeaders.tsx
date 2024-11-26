import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn } from 'react-native-reanimated'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenDetailsScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

export function HeaderTitleElement({
  data,
  ellipsisMenuVisible,
}: {
  data: TokenDetailsScreenQuery | undefined
  ellipsisMenuVisible?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const onChainData = data?.token
  const offChainData = onChainData?.project

  const price = offChainData?.markets?.[0]?.price?.value ?? onChainData?.market?.price?.value
  const logo = offChainData?.logoUrl ?? undefined
  const symbol = onChainData?.symbol
  const name = onChainData?.name
  const chain = onChainData?.chain

  return (
    <Flex alignItems="center" justifyContent="space-between" ml={ellipsisMenuVisible ? '$spacing32' : '$none'}>
      <Text color="$neutral1" variant="body1">
        {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
      </Text>
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
}

export function HeaderRightElement({
  currencyId,
  currentChainBalance,
  isBlocked,
  data,
  setEllipsisMenuVisible,
}: {
  currencyId: string
  currentChainBalance: PortfolioBalance | null
  isBlocked: boolean
  data?: TokenDetailsScreenQuery
  setEllipsisMenuVisible: (visible: boolean) => void
}): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId,
    isBlocked,
    tokenSymbolForNotification: data?.token?.symbol,
    portfolioBalance: currentChainBalance,
  })

  // Should be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()

  const ellipsisMenuVisible = menuActions.length > 0

  useEffect(() => {
    setEllipsisMenuVisible(ellipsisMenuVisible)
  }, [ellipsisMenuVisible, setEllipsisMenuVisible])

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing16">
      {ellipsisMenuVisible && (
        <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
          <TouchableArea
            hapticFeedback
            hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
            style={{ padding: spacing.spacing8, marginRight: -spacing.spacing8 }}
            testID={TestID.TokenDetailsMoreButton}
            onLongPress={disableOnPress}
            onPress={disableOnPress}
          >
            <EllipsisIcon color={ellipsisColor} height={iconSizes.icon16} width={iconSizes.icon16} />
          </TouchableArea>
        </ContextMenu>
      )}
      <TokenDetailsFavoriteButton currencyId={currencyId} />
    </AnimatedFlex>
  )
}
