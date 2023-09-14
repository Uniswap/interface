import { FlashList } from '@shopify/flash-list'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedBox } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import {
  TabProps,
  TAB_BAR_HEIGHT,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { HiddenTokensRow } from 'src/components/TokenBalanceList/HiddenTokensRow'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { IS_ANDROID } from 'src/constants/globals'
import { useTokenBalancesGroupedByVisibility } from 'src/features/balances/hooks'
import { Screens } from 'src/screens/Screens'
import { Flex, useSporeColors } from 'ui/src'
import { dimensions, zIndices } from 'ui/src/theme'
import { isError, isNonPollingRequestInFlight, isWarmLoadingStatus } from 'wallet/src/data/utils'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

type TokenBalanceListProps = TabProps & {
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId) => void
  isExternalProfile?: boolean
}

type Row = string | PortfolioBalance

const ESTIMATED_TOKEN_ITEM_HEIGHT = 64
const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW'

// accept any ref
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TokenBalanceList = forwardRef<FlashList<any>, TokenBalanceListProps>(
  function _TokenBalanceList(
    {
      owner,
      empty,
      onPressToken,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      refreshing,
      headerHeight = 0,
      onRefresh,
    },
    ref
  ) {
    const { t } = useTranslation()
    const colors = useSporeColors()
    const insets = useSafeAreaInsets()

    const { onContentSizeChange, adaptiveFooter, footerHeight } = useAdaptiveFooter(
      containerProps?.contentContainerStyle
    )

    // This function gets passed down through:
    // usePortfolioBalances -> the usePortfolioBalancesQuery query's onCompleted argument.
    const onCompleted = function (): void {
      // This is better than using network status to check, because doing it that way we would have to wait
      // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
      // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
      setIsWarmLoading(false)
    }

    const {
      data: balancesById,
      networkStatus,
      refetch,
    } = usePortfolioBalances({
      address: owner,
      shouldPoll: true,
      onCompleted,
      fetchPolicy: 'cache-and-network',
    })

    const [isWarmLoading, setIsWarmLoading] = useState(false)

    // re-order token balances to visible and hidden
    const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({
      balancesById,
    })
    const shouldShowHiddenTokens = !shownTokens?.length && !!hiddenTokens?.length
    const [hiddenTokensExpanded, setHiddenTokensExpanded] = useState(shouldShowHiddenTokens)

    const data = useMemo<Row[]>(() => {
      return [
        ...(shownTokens ?? []),
        ...(hiddenTokens?.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
        ...(hiddenTokensExpanded && hiddenTokens ? hiddenTokens : []),
      ]
    }, [shownTokens, hiddenTokens, hiddenTokensExpanded])

    useEffect(() => {
      if (!!balancesById && isWarmLoadingStatus(networkStatus) && !isExternalProfile) {
        setIsWarmLoading(true)
      }
    }, [balancesById, isExternalProfile, networkStatus])

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={
            insets.top + (IS_ANDROID && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
          }
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.val}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3.val, insets.top])

    // Note: `PerformanceView` must wrap the entire return statement to properly track interactive states.
    return (
      <ReactNavigationPerformanceView
        interactive={balancesById !== undefined}
        screenName={
          // Marks the home screen as interactive when balances are defined
          Screens.Home
        }>
        {!balancesById ? (
          isNonPollingRequestInFlight(networkStatus) ? (
            <Flex gap="$none" px="$spacing24" style={containerProps?.loadingContainerStyle}>
              <Loader.Token repeat={4} />
            </Flex>
          ) : (
            <Flex
              flex={1}
              flexGrow={1}
              gap="$none"
              justifyContent="center"
              style={containerProps?.emptyContainerStyle}>
              <BaseCard.ErrorState
                retryButtonLabel="Retry"
                title={t('Couldn’t load token balances')}
                onRetry={(): void | undefined => refetch?.()}
              />
            </Flex>
          )
        ) : (
          <AnimatedFlashList
            ref={ref}
            ListEmptyComponent={
              <Flex
                flexGrow={1}
                gap="$none"
                px="$spacing24"
                style={containerProps?.emptyContainerStyle}>
                {empty}
              </Flex>
            }
            // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
            ListFooterComponent={adaptiveFooter}
            // add negative z index to prevent footer from covering hidden tokens row when minimized
            ListFooterComponentStyle={{ zIndex: zIndices.negative }}
            ListHeaderComponent={
              isError(networkStatus, !!balancesById) ? (
                <AnimatedBox
                  entering={FadeInDown}
                  exiting={FadeOut}
                  gap="$none"
                  px="$spacing24"
                  py="$spacing8">
                  <BaseCard.InlineErrorState
                    title={t('Failed to fetch token balances')}
                    onRetry={refetch}
                  />
                </AnimatedBox>
              ) : null
            }
            data={data}
            disableAutoLayout={true}
            estimatedItemSize={ESTIMATED_TOKEN_ITEM_HEIGHT}
            keyExtractor={key}
            refreshControl={refreshControl}
            refreshing={refreshing}
            renderItem={({ item }): JSX.Element | null => {
              if (item === HIDDEN_TOKEN_BALANCES_ROW) {
                return (
                  <HiddenTokensRow
                    isExpanded={hiddenTokensExpanded}
                    numHidden={hiddenTokens?.length ?? 0}
                    onPress={(): void => {
                      if (hiddenTokensExpanded) {
                        footerHeight.value = dimensions.fullHeight
                      }
                      setHiddenTokensExpanded(!hiddenTokensExpanded)
                    }}
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
            onContentSizeChange={onContentSizeChange}
            onRefresh={onRefresh}
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
