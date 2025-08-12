import { NetworkStatus } from '@apollo/client'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useIsFocused } from '@react-navigation/core'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TokenBalanceItemContextMenu } from 'src/components/TokenBalanceList/TokenBalanceItemContextMenu'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TAB_BAR_HEIGHT, TAB_VIEW_SCROLL_THROTTLE, TabProps } from 'src/components/layout/TabHelpers'
import { Flex, Loader, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { zIndexes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { isError, isNonPollingRequestInFlight } from 'uniswap/src/data/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { isAndroid } from 'utilities/src/platform'
import { TokenBalanceItem } from 'wallet/src/features/portfolio/TokenBalanceItem'
import {
  HIDDEN_TOKEN_BALANCES_ROW,
  TokenBalanceListContextProvider,
  TokenBalanceListRow,
  useTokenBalanceListContext,
} from 'wallet/src/features/portfolio/TokenBalanceListContext'

type TokenBalanceListProps = TabProps & {
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId) => void
  isExternalProfile?: boolean
}

const ESTIMATED_TOKEN_ITEM_HEIGHT = 64

export const TokenBalanceList = forwardRef<FlatList<TokenBalanceListRow>, TokenBalanceListProps>(
  function _TokenBalanceList({ owner, onPressToken, isExternalProfile = false, ...rest }, ref): JSX.Element {
    return (
      <TokenBalanceListContextProvider isExternalProfile={isExternalProfile} owner={owner} onPressToken={onPressToken}>
        <TokenBalanceListInner
          ref={ref}
          isExternalProfile={isExternalProfile}
          owner={owner}
          onPressToken={onPressToken}
          {...rest}
        />
      </TokenBalanceListContextProvider>
    )
  },
)

const TokenBalanceListInner = forwardRef<FlatList<TokenBalanceListRow>, TokenBalanceListProps>(
  function _TokenBalanceListInner(
    {
      empty,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      renderedInModal = false,
      refreshing,
      headerHeight = 0,
      onRefresh,
      testID,
    },
    ref,
  ) {
    const colors = useSporeColors()
    const insets = useAppInsets()

    usePerformanceLogger(DDRumManualTiming.RenderTokenBalanceList, [])

    const { rows, balancesById } = useTokenBalanceListContext()

    const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    const [localIsFocused, setLocalIsFocused] = useState<boolean>(true)

    const reactNavigationIsFocused = useIsFocused()

    // used for window size adjustment based on focus state (smaller window size when out of focus)
    const isFocused = localIsFocused || reactNavigationIsFocused

    const navigation = useAppStackNavigation()

    useEffect(() => {
      // We use this instead of relying on react-navigation's `useIsFocused` because we want to speed up the screen transition
      // when the user goes from the token details screen back to the home screen, so we want this state to change *after* the animation is done instead of *before*.
      const unsubscribeTransitionEnd = navigation.addListener('transitionEnd', (e) => {
        if (!e.data.closing) {
          setLocalIsFocused(true)
        }
      })

      return (): void => unsubscribeTransitionEnd()
    }, [navigation])

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)}
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [insets.top, headerHeight, refreshing, colors.neutral3, onRefresh])

    // In order to avoid unnecessary re-renders of the entire FlatList, the `renderItem` function should never change.
    // That's why we use a context provider so that each row can read from there instead of passing down new props every time the data changes.
    const renderItem = useCallback(
      ({ item }: { item: TokenBalanceListRow }): JSX.Element => <TokenBalanceItemRow item={item} />,
      [],
    )

    const keyExtractor = useCallback((item: TokenBalanceListRow): string => item, [])

    const ListEmptyComponent = useMemo(() => {
      return <EmptyComponent renderEmpty={empty} />
    }, [empty])

    const ListHeaderComponent = useMemo(() => {
      return <HeaderComponent />
    }, [])

    // add negative z index to prevent footer from covering hidden tokens row when minimized
    const ListFooterComponentStyle = useMemo(() => ({ zIndex: zIndexes.negative }), [])

    const List = renderedInModal ? BottomSheetFlatList<TokenBalanceListRow> : Animated.FlatList<TokenBalanceListRow>

    const getItemLayout = useCallback(
      (_: Maybe<ArrayLike<string>>, index: number): { length: number; offset: number; index: number } => ({
        length: ESTIMATED_TOKEN_ITEM_HEIGHT,
        offset: ESTIMATED_TOKEN_ITEM_HEIGHT * index,
        index,
      }),
      [],
    )

    const data = balancesById ? rows : undefined

    // Note: `PerformanceView` must wrap the entire return statement to properly track interactive states.
    return (
      <ReactNavigationPerformanceView
        interactive={balancesById !== undefined}
        screenName={
          // Marks the home screen as interactive when balances are defined
          MobileScreens.Home
        }
      >
        <List
          ref={ref as never}
          ListEmptyComponent={ListEmptyComponent}
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          ListFooterComponentStyle={ListFooterComponentStyle}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={containerProps?.contentContainerStyle}
          data={data}
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={10}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderItem={renderItem}
          scrollEventThrottle={containerProps?.scrollEventThrottle ?? TAB_VIEW_SCROLL_THROTTLE}
          showsVerticalScrollIndicator={false}
          testID={testID}
          windowSize={isFocused ? 10 : 3}
          onContentSizeChange={onContentSizeChange}
          onMomentumScrollEnd={containerProps?.onMomentumScrollEnd}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          onScrollEndDrag={containerProps?.onScrollEndDrag}
        />
      </ReactNavigationPerformanceView>
    )
  },
)

const HeaderComponent = memo(function _HeaderComponent(): JSX.Element | null {
  const { t } = useTranslation()
  const { balancesById, networkStatus, refetch } = useTokenBalanceListContext()
  const hasErrorWithCachedValues = !!balancesById && networkStatus === NetworkStatus.error

  return hasErrorWithCachedValues ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOut} px="$spacing24" py="$spacing8">
      <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
    </AnimatedFlex>
  ) : null
})

const EmptyComponent = memo(function _EmptyComponent({
  renderEmpty,
}: {
  renderEmpty?: JSX.Element | null
}): JSX.Element {
  const { t } = useTranslation()
  const { balancesById, networkStatus, refetch } = useTokenBalanceListContext()

  const isLoadingWithoutCachedValues = !balancesById && isNonPollingRequestInFlight(networkStatus)
  const hasErrorWithoutCachedValues = isError(networkStatus, !!balancesById)

  if (isLoadingWithoutCachedValues) {
    return (
      <Flex px="$spacing24">
        <Loader.Token withPrice repeat={6} />
      </Flex>
    )
  }

  if (hasErrorWithoutCachedValues) {
    return (
      <Flex pt="$spacing24">
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('home.tokens.error.load')}
          onRetry={(): void | undefined => refetch?.()}
        />
      </Flex>
    )
  }

  return (
    <Flex grow px="$spacing24">
      {renderEmpty}
    </Flex>
  )
})

const TokenBalanceItemRow = memo(function TokenBalanceItemRow({ item }: { item: TokenBalanceListRow }) {
  const { balancesById, isWarmLoading, onPressToken } = useTokenBalanceListContext()

  const portfolioBalance = balancesById?.[item]
  const hasPortfolioBalance = !!portfolioBalance

  const tokenBalanceItem = useMemo(() => {
    if (!hasPortfolioBalance) {
      return null
    }

    return (
      <TokenBalanceItem
        padded
        isHidden={portfolioBalance.isHidden ?? false}
        portfolioBalanceId={portfolioBalance.id}
        isLoading={isWarmLoading}
        currencyInfo={portfolioBalance.currencyInfo}
        onPressToken={onPressToken}
      />
    )
  }, [
    hasPortfolioBalance,
    portfolioBalance?.id,
    portfolioBalance?.isHidden,
    portfolioBalance?.currencyInfo,
    isWarmLoading,
    onPressToken,
  ])

  if (item === HIDDEN_TOKEN_BALANCES_ROW) {
    return <HiddenTokensRowWrapper />
  }

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
    <TokenBalanceItemContextMenu portfolioBalance={portfolioBalance}>{tokenBalanceItem}</TokenBalanceItemContextMenu>
  )
})

const HiddenTokensRowWrapper = memo(function HiddenTokensRowWrapper(): JSX.Element {
  const { t } = useTranslation()

  const { hiddenTokensCount, hiddenTokensExpanded, setHiddenTokensExpanded } = useTokenBalanceListContext()

  const handlePressToken = useCallback((): void => {
    navigate(ModalName.HiddenTokenInfoModal)
  }, [])

  return (
    <Flex grow>
      <ExpandoRow
        isExpanded={hiddenTokensExpanded}
        label={t('hidden.tokens.info.text.button', { numHidden: hiddenTokensCount })}
        mx="$spacing16"
        onPress={(): void => {
          setHiddenTokensExpanded(!hiddenTokensExpanded)
        }}
      />
      {hiddenTokensExpanded && (
        <Flex mx="$spacing12">
          <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={handlePressToken} />
        </Flex>
      )}
    </Flex>
  )
})
