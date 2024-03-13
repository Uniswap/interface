import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/core'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TokenBalanceItemContextMenu } from 'src/components/TokenBalanceList/TokenBalanceItemContextMenu'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import {
  TAB_BAR_HEIGHT,
  TAB_VIEW_SCROLL_THROTTLE,
  TabProps,
} from 'src/components/layout/TabHelpers'
import { Screens } from 'src/screens/Screens'
import {
  AnimatedFlex,
  Flex,
  Loader,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import { zIndices } from 'ui/src/theme'
import { isAndroid } from 'uniswap/src/utils/platform'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { HiddenTokensRow } from 'wallet/src/features/portfolio/HiddenTokensRow'
import { TokenBalanceItem } from 'wallet/src/features/portfolio/TokenBalanceItem'
import {
  HIDDEN_TOKEN_BALANCES_ROW,
  TokenBalanceListContextProvider,
  TokenBalanceListRow,
  useTokenBalanceListContext,
} from 'wallet/src/features/portfolio/TokenBalanceListContext'
import { CurrencyId } from 'wallet/src/utils/currencyId'

type TokenBalanceListProps = TabProps & {
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId) => void
  isExternalProfile?: boolean
}

const ESTIMATED_TOKEN_ITEM_HEIGHT = 64

export const TokenBalanceList = forwardRef<FlatList<TokenBalanceListRow>, TokenBalanceListProps>(
  function _TokenBalanceList(
    { owner, onPressToken, isExternalProfile = false, ...rest },
    ref
  ): JSX.Element {
    return (
      <TokenBalanceListContextProvider
        isExternalProfile={isExternalProfile}
        owner={owner}
        onPressToken={onPressToken}>
        <TokenBalanceListInner
          ref={ref}
          isExternalProfile={isExternalProfile}
          owner={owner}
          onPressToken={onPressToken}
          {...rest}
        />
      </TokenBalanceListContextProvider>
    )
  }
)

export const TokenBalanceListInner = forwardRef<
  FlatList<TokenBalanceListRow>,
  TokenBalanceListProps
>(function _TokenBalanceListInner(
  {
    empty,
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
  const insets = useDeviceInsets()

  const { rows, balancesById, networkStatus, refetch } = useTokenBalanceListContext()

  const { onContentSizeChange, adaptiveFooter, footerHeight } = useAdaptiveFooter(
    containerProps?.contentContainerStyle
  )

  // The following logic is meant to speed up the screen transition from the token details screen back to the home screen.
  // When we call `navigation.goBack()`, a re-render is triggered *before* the animation begins.
  // In order for that first re-render to be fast, we use `cachedData` so that it renders a memoized `FlatList` of tokens,
  // (this `FlatList` is the most expensive component on this screen).
  // After the transition ends, we set focus to `true` to trigger a re-render using the latest `data`.

  const [isFocused, setIsFocused] = useState<boolean>(true)
  const [cachedRows, setCachedRows] = useState<TokenBalanceListRow[] | null>(null)

  const rowsRef = useRef(rows)
  rowsRef.current = rows

  useFocusEffect(
    useCallback(() => {
      return (): void => {
        // We save the cached data to avoid a re-render when the user navigates back to it.
        // This speeds up the animation while preserving the scroll position.
        setCachedRows(rowsRef.current)
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

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl
        progressViewOffset={
          insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
        }
        refreshing={refreshing ?? false}
        tintColor={colors.neutral3.get()}
        onRefresh={onRefresh}
      />
    )
  }, [insets.top, headerHeight, refreshing, colors.neutral3, onRefresh])

  // In order to avoid unnecessary re-renders of the entire FlatList, the `renderItem` function should never change.
  // That's why we use a context provider so that each row can read from there instead of passing down new props every time the data changes.
  const renderItem = useCallback(
    ({ item }: { item: TokenBalanceListRow }): JSX.Element => {
      return <TokenBalanceItemRow footerHeight={footerHeight} item={item} />
    },
    [footerHeight]
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
        <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
      </AnimatedFlex>
    ) : null
  }, [hasError, refetch, t])

  // add negative z index to prevent footer from covering hidden tokens row when minimized
  const ListFooterComponentStyle = useMemo(() => ({ zIndex: zIndices.negative }), [])

  const List = renderedInModal
    ? BottomSheetFlatList<TokenBalanceListRow>
    : Animated.FlatList<TokenBalanceListRow>

  const getItemLayout = useCallback(
    (
      _: Maybe<TokenBalanceListRow[]>,
      index: number
    ): { length: number; offset: number; index: number } => ({
      length: ESTIMATED_TOKEN_ITEM_HEIGHT,
      offset: ESTIMATED_TOKEN_ITEM_HEIGHT * index,
      index,
    }),
    []
  )

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
            <Loader.Token withPrice repeat={6} />
          </Flex>
        ) : (
          <Flex fill grow justifyContent="center" style={containerProps?.emptyContainerStyle}>
            <BaseCard.ErrorState
              retryButtonLabel={t('common.button.retry')}
              title={t('home.tokens.error.load')}
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
          data={isFocused ? rows : cachedRows}
          getItemLayout={getItemLayout}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderItem={renderItem}
          scrollEventThrottle={containerProps?.scrollEventThrottle ?? TAB_VIEW_SCROLL_THROTTLE}
          showsVerticalScrollIndicator={false}
          updateCellsBatchingPeriod={10}
          windowSize={isFocused ? 10 : 3}
          onContentSizeChange={onContentSizeChange}
          onMomentumScrollEnd={containerProps?.onMomentumScrollEnd}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          onScrollEndDrag={containerProps?.onScrollEndDrag}
        />
      )}
    </ReactNavigationPerformanceView>
  )
})

const TokenBalanceItemRow = memo(function TokenBalanceItemRow({
  item,
  footerHeight,
}: {
  item: TokenBalanceListRow
  footerHeight: Animated.SharedValue<number>
}) {
  const { fullHeight } = useDeviceDimensions()

  const {
    balancesById,
    hiddenTokensCount,
    hiddenTokensExpanded,
    isWarmLoading,
    onPressToken,
    setHiddenTokensExpanded,
  } = useTokenBalanceListContext()

  if (item === HIDDEN_TOKEN_BALANCES_ROW) {
    return (
      <HiddenTokensRow
        padded
        isExpanded={hiddenTokensExpanded}
        numHidden={hiddenTokensCount}
        onPress={(): void => {
          if (hiddenTokensExpanded) {
            footerHeight.value = fullHeight
          }
          setHiddenTokensExpanded(!hiddenTokensExpanded)
        }}
      />
    )
  }

  const portfolioBalance = balancesById?.[item]

  if (!portfolioBalance) {
    // This can happen when the view is out of focus and the user sells/sends 100% of a token's balance.
    // In that case, the token is removed from the `balancesById` object, but the FlatList is still using the cached array of IDs until the view comes back into focus.
    // As soon as the view comes back into focus, the FlatList will re-render with the latest data, so users won't really see this Skeleton for more than a few milliseconds when this happens.
    return (
      <Flex height={ESTIMATED_TOKEN_ITEM_HEIGHT} px="$spacing24">
        <Loader.Token />
      </Flex>
    )
  }

  return (
    <TokenBalanceItemContextMenu portfolioBalance={portfolioBalance}>
      <TokenBalanceItem
        padded
        isLoading={isWarmLoading}
        portfolioBalance={portfolioBalance}
        onPressToken={onPressToken}
      />
    </TokenBalanceItemContextMenu>
  )
})
