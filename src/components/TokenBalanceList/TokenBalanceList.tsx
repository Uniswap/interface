import { FlashList } from '@shopify/flash-list'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSelector } from 'src/app/hooks'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import {
  TabContentProps,
  TAB_BAR_HEIGHT,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { HiddenTokensRow } from 'src/components/TokenBalanceList/HiddenTokensRow'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isError, isNonPollingRequestInFlight, isWarmLoadingStatus } from 'src/data/utils'
import { useSortedPortfolioBalances } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { CurrencyId } from 'src/utils/currencyId'
import { useSuspendUpdatesWhenBlured } from 'src/utils/hooks'

type TokenBalanceListProps = {
  owner: Address
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId) => void
  containerProps?: TabContentProps
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const ESTIMATED_TOKEN_ITEM_HEIGHT = 64
const HIDDEN_TOKENS_ROW = 'HIDDEN_TOKENS_ROW'

// accept any ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TokenBalanceList = forwardRef<FlashList<any>, TokenBalanceListProps>(
  ({ owner, empty, onPressToken, containerProps, scrollHandler }, ref) => {
    const { t } = useTranslation()
    const insets = useSafeAreaInsets()

    const hideSmallBalances: boolean = useAppSelector(makeSelectAccountHideSmallBalances(owner))
    const hideSpamTokens: boolean = useAppSelector(makeSelectAccountHideSpamTokens(owner))

    // This function gets passed down through:
    // useSortedPortfolioBalances -> usePortfolioBalances -> the usePortfolioBalancesQuery query's onCompleted argument.
    const onCompleted = function (): void {
      // This is better than using network status to check, because doing it that way we would have to wait
      // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
      // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
      setIsWarmLoading(false)
    }

    const { data, networkStatus, refetch } = useSuspendUpdatesWhenBlured(
      useSortedPortfolioBalances(
        owner,
        /*shouldPoll=*/ true,
        hideSmallBalances,
        hideSpamTokens,
        onCompleted
      )
    )
    const hasOnlyHiddenTokens =
      !data?.balances.length && (!!data?.smallBalances.length || !!data?.spamBalances.length)

    const [isWarmLoading, setIsWarmLoading] = useState(false)
    const [hiddenTokensExpanded, setHiddenTokensExpanded] = useState(hasOnlyHiddenTokens)

    useEffect(() => {
      // Reset hidden tokens expanded state when owner changes
      // Expand hidden tokens section if there are only hidden tokens
      setHiddenTokensExpanded(hasOnlyHiddenTokens)
    }, [hasOnlyHiddenTokens, owner])

    useEffect(() => {
      if (!!data && isWarmLoadingStatus(networkStatus)) {
        setIsWarmLoading(true)
      }
    }, [data, networkStatus])

    const listItems: (PortfolioBalance | string)[] = useMemo(() => {
      if (!data) return EMPTY_ARRAY

      const { balances, smallBalances, spamBalances } = data

      // No balances
      if (!balances.length && !smallBalances.length && !spamBalances.length) return EMPTY_ARRAY

      // No hidden tokens
      if (balances.length > 0 && smallBalances.length === 0 && spamBalances.length === 0)
        return balances

      // Show non-hidden tokens and hidden tokens row
      if (!hiddenTokensExpanded) return [...balances, HIDDEN_TOKENS_ROW]

      // Show all tokens including hidden
      return [...balances, HIDDEN_TOKENS_ROW, ...smallBalances, ...spamBalances]
    }, [data, hiddenTokensExpanded])

    const estimatedContentHeight = dimensions.fullHeight - TAB_BAR_HEIGHT - insets.top
    const numHiddenTokens = (data?.smallBalances?.length ?? 0) + (data?.spamBalances?.length ?? 0)

    // Note: `PerformanceView` must wrap the entire return statement to properly track interactive states.
    return (
      <ReactNavigationPerformanceView
        interactive={data !== undefined}
        screenName={
          // Marks the home screen as intereactive when balances are defined
          Screens.Home
        }>
        {!data ? (
          isNonPollingRequestInFlight(networkStatus) ? (
            <Box my="spacing12" style={containerProps?.loadingContainerStyle}>
              <Loader.Token repeat={4} />
            </Box>
          ) : (
            <Box
              flex={1}
              flexGrow={1}
              justifyContent="center"
              style={containerProps?.emptyContainerStyle}>
              <BaseCard.ErrorState
                retryButtonLabel="Retry"
                title={t("Couldn't load token balances")}
                onRetry={(): void | undefined => refetch?.()}
              />
            </Box>
          )
        ) : listItems.length === 0 ? (
          <Flex grow style={containerProps?.emptyContainerStyle}>
            {empty}
          </Flex>
        ) : (
          <AnimatedFlashList
            ref={ref}
            ListFooterComponent={
              <Box
                height={
                  // We need this since FlashList doesn't support minHeight as part of its contentContainerStyle.
                  // Ensures content fills remainder of screen to support smooth tab switching
                  estimatedContentHeight - (listItems.length + 1) * ESTIMATED_TOKEN_ITEM_HEIGHT
                }
              />
            }
            ListHeaderComponent={
              isError(networkStatus, !!data) ? (
                <AnimatedBox entering={FadeInDown} exiting={FadeOut} py="spacing8">
                  <BaseCard.InlineErrorState
                    title={t('Failed to fetch token balances')}
                    onRetry={refetch}
                  />
                </AnimatedBox>
              ) : null
            }
            data={listItems}
            estimatedItemSize={ESTIMATED_TOKEN_ITEM_HEIGHT}
            keyExtractor={key}
            renderItem={({ item }): JSX.Element | null => {
              if (item === HIDDEN_TOKENS_ROW) {
                return (
                  <HiddenTokensRow
                    isExpanded={hiddenTokensExpanded}
                    numHidden={numHiddenTokens}
                    onPress={(): void => setHiddenTokensExpanded(!hiddenTokensExpanded)}
                  />
                )
              } else if (isPortfolioBalance(item)) {
                return (
                  <TokenBalanceItem
                    isWarmLoading={isWarmLoading}
                    portfolioBalance={item}
                    onPressToken={onPressToken}
                  />
                )
              }
              return null
            }}
            scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            onScroll={scrollHandler}
            {...containerProps}
          />
        )}
      </ReactNavigationPerformanceView>
    )
  }
)

function isPortfolioBalance(obj: string | PortfolioBalance): obj is PortfolioBalance {
  return (obj as PortfolioBalance).currencyInfo !== undefined
}

function key(item: PortfolioBalance | string): string {
  if (isPortfolioBalance(item)) return item.currencyInfo.currencyId
  return item
}
