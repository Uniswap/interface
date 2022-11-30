import { SpacingShorthandProps } from '@shopify/restyle'
import React, { forwardRef, ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabContentProps, TAB_VIEW_SCROLL_THROTTLE } from 'src/components/layout/TabHelpers'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { isError, isNonPollingRequestInFlight, isWarmLoadingStatus } from 'src/data/utils'
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
  onPressToken: (currencyId: CurrencyId) => void
  containerProps?: TabContentProps
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

export const TokenBalanceList = forwardRef<Animated.FlatList<any>, TokenBalanceListProps>(
  ({ owner, empty, onPressToken, containerProps, scrollHandler }, ref) => {
    const { t } = useTranslation()

    const hideSmallBalances: boolean = useAppSelector(makeSelectAccountHideSmallBalances(owner))
    const hideSpamTokens: boolean = useAppSelector(makeSelectAccountHideSpamTokens(owner))

    // This function gets passed down through:
    // useSortedPortfolioBalances -> usePortfolioBalances -> the usePortfolioBalancesQuery query's onCompleted argument.
    const onCompleted = function () {
      // This is better than using network status to check, because doing it that way we would have to wait
      // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
      // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
      setIsWarmLoading(false)
    }

    const { data, networkStatus, refetch } = useSortedPortfolioBalances(
      owner,
      /*shouldPoll=*/ true,
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
      if (isNonPollingRequestInFlight(networkStatus)) {
        return (
          <Box my="sm" style={containerProps?.loadingContainerStyle}>
            <Loading repeat={4} type="token" />
          </Box>
        )
      }

      return (
        <Box
          flex={1}
          flexGrow={1}
          justifyContent="center"
          style={containerProps?.loadingContainerStyle}>
          <BaseCard.ErrorState
            retryButtonLabel="Retry"
            title={t("Couldn't load token balances")}
            onRetry={() => refetch?.()}
          />
        </Box>
      )
    }

    const { balances, smallBalances, spamBalances } = data
    const numHiddenTokens = smallBalances.length + spamBalances.length

    return balances.length === 0 ? (
      <Flex centered grow style={containerProps?.loadingContainerStyle}>
        <HiddenTokensRow address={owner} mt="xs" numHidden={numHiddenTokens} />
        {empty}
      </Flex>
    ) : (
      <AnimatedFlatList
        ref={ref}
        ListFooterComponent={
          <HiddenTokensRow address={owner} mb="xl" mt="sm" numHidden={numHiddenTokens} />
        }
        ListHeaderComponent={
          isError(networkStatus, !!data) ? (
            <AnimatedBox entering={FadeInDown} exiting={FadeOut} py="xs">
              <BaseCard.InlineErrorState
                title={t('Failed to fetch token balances')}
                onRetry={refetch}
              />
            </AnimatedBox>
          ) : null
        }
        data={balances}
        keyExtractor={key}
        renderItem={(item) => (
          <TokenBalanceItem
            isWarmLoading={isWarmLoading}
            portfolioBalance={item?.item}
            onPressToken={onPressToken}
          />
        )}
        scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        onScroll={scrollHandler}
        {...containerProps}
      />
    )
  }
)

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
      <Flex row justifyContent="space-between">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Hidden ({{numHidden}})', { numHidden })}
        </Text>
        <Chevron color={theme.colors.textSecondary} direction="e" />
      </Flex>
    </TouchableArea>
  )
}
