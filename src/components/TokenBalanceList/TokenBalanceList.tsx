import { SpacingShorthandProps } from '@shopify/restyle'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { isWarmLoadingStatus } from 'src/data/utils'
import { useSortedPortfolioBalances } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

type TokenBalanceListProps = {
  owner: Address
  empty?: ReactElement | null
  onPressTokenIn: (currencyId: CurrencyId) => void
  onPressToken: (currencyId: CurrencyId) => void
  onRefresh?: () => void
  tabViewScrollProps?: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}

export function TokenBalanceList({
  owner,
  empty,
  onPressToken,
  onPressTokenIn,
  tabViewScrollProps,
  loadingContainerStyle,
}: TokenBalanceListProps) {
  const hideSmallBalances = useAppSelector(makeSelectAccountHideSmallBalances(owner))
  const hideSpamTokens = useAppSelector(makeSelectAccountHideSpamTokens(owner))

  // This function gets passed down through:
  // useSortedPortfolioBalances -> usePortfolioBalances -> the usePortfolioBalancesQuery query's onCompleted argument.
  const onCompleted = function () {
    // This is better than using network status to check, because doing it that way we would have to wait
    // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
    // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
    setIsWarmLoading(false)
  }

  const { data, networkStatus } = useSortedPortfolioBalances(
    owner,
    hideSmallBalances,
    hideSpamTokens,
    onCompleted
  )

  const [isWarmLoading, setIsWarmLoading] = useState(false)

  useEffect(() => {
    if (!!data && isWarmLoadingStatus(networkStatus)) {
      setIsWarmLoading(true)
    }
  }, [data, networkStatus])

  if (!data) {
    return (
      <Box m="sm" style={loadingContainerStyle}>
        <Loading repeat={4} type="token" />
      </Box>
    )
  }

  const { balances, smallBalances, spamBalances } = data
  const numHiddenTokens = smallBalances.length + spamBalances.length

  return (
    <AnimatedFlatList
      ListEmptyComponent={
        <>
          <HiddenTokensRow address={owner} my="md" numHidden={numHiddenTokens} />
          {empty}
        </>
      }
      ListFooterComponent={
        <HiddenTokensRow address={owner} mb="xl" mt="sm" numHidden={numHiddenTokens} />
      }
      // TODO(MOB-3482): add error component here using judo's new error wrapper component from #2302
      // ListHeaderComponent={error ? <ErrorHandler>Oops!</ErrorHandler> : null}
      data={balances}
      keyExtractor={key}
      renderItem={({ item }: { item: PortfolioBalance }) => (
        <TokenBalanceItem
          isWarmLoading={isWarmLoading}
          portfolioBalance={item}
          onPressToken={onPressToken}
          onPressTokenIn={onPressTokenIn}
        />
      )}
      scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
      showsVerticalScrollIndicator={false}
      windowSize={5}
      onScroll={tabViewScrollProps?.onScroll}
      {...tabViewScrollProps}
    />
  )
}

function key({ currencyInfo }: PortfolioBalance) {
  return currencyInfo.currencyId
}

function HiddenTokensRow({
  numHidden,
  address,
  ...props
}: { numHidden: number; address: Address } & SpacingShorthandProps<Theme>) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()

  const onPressHiddenTokens = useCallback(() => {
    navigation.navigate(Screens.HiddenTokens, {
      address,
    })
  }, [navigation, address])

  if (numHidden === 0) return null

  return (
    <TouchableArea onPress={onPressHiddenTokens} {...props}>
      <Flex row justifyContent="space-between" mx="xs">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Hidden ({{numHidden}})', { numHidden })}
        </Text>
        <Chevron color={theme.colors.textSecondary} direction="e" />
      </Flex>
    </TouchableArea>
  )
}
