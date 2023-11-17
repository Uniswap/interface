import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/core'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import {
  TabProps,
  TAB_BAR_HEIGHT,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { HiddenTokensRow } from 'src/components/TokenBalanceList/HiddenTokensRow'
import { TokenBalanceItemContextMenu } from 'src/components/TokenBalanceList/TokenBalanceItemContextMenu'
import { IS_ANDROID } from 'src/constants/globals'
import { useTokenBalancesGroupedByVisibility } from 'src/features/balances/hooks'
import { Screens } from 'src/screens/Screens'
import { AnimatedFlex, Flex, useDeviceDimensions, useDeviceInsets, useSporeColors } from 'ui/src'
import { zIndices } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { isError, isNonPollingRequestInFlight, isWarmLoadingStatus } from 'wallet/src/data/utils'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { TokenBalanceItem } from 'wallet/src/features/portfolio/TokenBalanceItem'
import { CurrencyId } from 'wallet/src/utils/currencyId'

type TokenBalanceListProps = TabProps & {
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId) => void
  isExternalProfile?: boolean
}

const ESTIMATED_TOKEN_ITEM_HEIGHT = 64
const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW' as const

export type TokenBalanceListItem = typeof HIDDEN_TOKEN_BALANCES_ROW | PortfolioBalance

export const TokenBalanceList = forwardRef<FlatList<TokenBalanceListItem>, TokenBalanceListProps>(
  function _TokenBalanceList(
    {
      owner,
      empty,
      onPressToken,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      renderedInModal = false,
      refreshing,
      headerHeight = 0,
      onRefresh,
    },
    ref
  ) {
    const { t } = useTranslation()
    const colors = useSporeColors()
    const dimensions = useDeviceDimensions()
    const insets = useDeviceInsets()

    const { onContentSizeChange, adaptiveFooter, footerHeight } = useAdaptiveFooter(
      containerProps?.contentContainerStyle
    )

    // This function gets passed down through:
    // usePortfolioBalances -> the usePortfolioBalancesQuery query's onCompleted argument.
    const onCompleted = useCallback(function (): void {
      // This is better than using network status to check, because doing it that way we would have to wait
      // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
      // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
      setIsWarmLoading(false)
    }, [])

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

    const data = useMemo<TokenBalanceListItem[]>(() => {
      return [
        ...(shownTokens ?? []),
        ...(hiddenTokens?.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
        ...(hiddenTokensExpanded && hiddenTokens ? hiddenTokens : []),
      ]
    }, [shownTokens, hiddenTokens, hiddenTokensExpanded])

    // The following logic is meant to speed up the screen transition from the token details screen back to the home screen.
    // When we call `navigation.goBack()`, a re-render is triggered *before* the animation begins.
    // In order for that first re-render to be fast, we use `cachedData` so that it renders a memoized `FlatList` of tokens,
    // (this `FlatList` is the most expensive component on this screen).
    // After the transition ends, we set focus to `true` to trigger a re-render using the latest `data`.

    const [isFocused, setIsFocused] = useState<boolean>(true)
    const [cachedData, setCachedData] = useState<TokenBalanceListItem[] | null>(null)

    const dataRef = useRef(data)
    dataRef.current = data

    useFocusEffect(
      useCallback(() => {
        return (): void => {
          // We save the cached data to avoid a re-render when the user navigates back to it.
          // This speeds up the animation while preserving the scroll position.
          setCachedData(dataRef.current)
          setIsFocused(false)
        }
      }, [])
    )

    const navigation = useAppStackNavigation()

    useEffect(() => {
      // We use this instead of relying on react-navigation's `useIsFocused` because we want to speed up the screen transition
      // when the user goes from the token details screen back to the home screen, so we want this state to change *after* the animation is done instead of *before*.
      const unsubscribeTransitionEnd = navigation.addListener('transitionEnd', (e) => {
        if (!e.data.closing) {
          setIsFocused(true)
        }
      })

      return (): void => unsubscribeTransitionEnd()
    }, [navigation])

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
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [insets.top, headerHeight, refreshing, colors.neutral3, onRefresh])

    const renderItem = useCallback(
      ({ item }: { item: TokenBalanceListItem }): JSX.Element => {
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
        }

        return (
          <TokenBalanceItemContextMenu portfolioBalance={item}>
            <TokenBalanceItem
              padded
              isLoading={isWarmLoading}
              portfolioBalance={item}
              onPressToken={onPressToken}
            />
          </TokenBalanceItemContextMenu>
        )
      },
      [
        dimensions.fullHeight,
        footerHeight,
        hiddenTokens?.length,
        hiddenTokensExpanded,
        isWarmLoading,
        onPressToken,
      ]
    )

    const ListEmptyComponent = useMemo(() => {
      return (
        <Flex grow px="$spacing24" style={containerProps?.emptyContainerStyle}>
          {empty}
        </Flex>
      )
    }, [containerProps?.emptyContainerStyle, empty])

    const hasError = isError(networkStatus, !!balancesById)

    const ListHeaderComponent = useMemo(() => {
      return hasError ? (
        <AnimatedFlex entering={FadeInDown} exiting={FadeOut} px="$spacing24" py="$spacing8">
          <BaseCard.InlineErrorState
            title={t('Failed to fetch token balances')}
            onRetry={refetch}
          />
        </AnimatedFlex>
      ) : null
    }, [hasError, refetch, t])

    // add negative z index to prevent footer from covering hidden tokens row when minimized
    const ListFooterComponentStyle = useMemo(() => ({ zIndex: zIndices.negative }), [])

    const List = renderedInModal
      ? BottomSheetFlatList<TokenBalanceListItem>
      : Animated.FlatList<TokenBalanceListItem>

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
            <Flex px="$spacing24" style={containerProps?.loadingContainerStyle}>
              <Loader.Token repeat={6} />
            </Flex>
          ) : (
            <Flex fill grow justifyContent="center" style={containerProps?.emptyContainerStyle}>
              <BaseCard.ErrorState
                retryButtonLabel="Retry"
                title={t('Couldn’t load token balances')}
                onRetry={(): void | undefined => refetch?.()}
              />
            </Flex>
          )
        ) : (
          <List
            ref={ref as never}
            ListEmptyComponent={ListEmptyComponent}
            // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
            ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
            ListFooterComponentStyle={ListFooterComponentStyle}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={containerProps?.contentContainerStyle}
            data={isFocused ? data : cachedData}
            getItemLayout={(_, index): { length: number; offset: number; index: number } => ({
              length: ESTIMATED_TOKEN_ITEM_HEIGHT,
              offset: ESTIMATED_TOKEN_ITEM_HEIGHT * index,
              index,
            })}
            initialNumToRender={20}
            keyExtractor={key}
            maxToRenderPerBatch={20}
            refreshControl={refreshControl}
            refreshing={refreshing}
            renderItem={renderItem}
            scrollEventThrottle={containerProps?.scrollEventThrottle ?? TAB_VIEW_SCROLL_THROTTLE}
            showsVerticalScrollIndicator={false}
            updateCellsBatchingPeriod={10}
            onContentSizeChange={onContentSizeChange}
            onMomentumScrollEnd={containerProps?.onMomentumScrollEnd}
            onRefresh={onRefresh}
            onScroll={scrollHandler}
            onScrollEndDrag={containerProps?.onScrollEndDrag}
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
