import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import {
  AnimatedFlex,
  Flex,
  Loader,
  UniversalList,
  useIsRowViewable,
  zIndexes,
  type UniversalListRef,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown, FadeOut } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TabProps } from 'src/components/layout/TabHelpers'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { HiddenTokensRow } from 'uniswap/src/components/portfolio/HiddenTokensRow'
import {
  TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT,
  TokenBalanceItem,
} from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItem'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import {
  TokenBalanceListContextProvider,
  TokenBalancePressOptions,
  useTokenBalanceItemConfig,
  useTokenBalanceListContext,
  useTokenBalanceRowBalance,
} from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { noop } from 'utilities/src/react/noop'

const EMPTY_ROWS: TokenBalanceListRow[] = []

type TokenBalanceListProps = TabProps & {
  empty?: JSX.Element | null
  onPressToken: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
  isExternalProfile?: boolean
}

export const TokenBalanceList = forwardRef<UniversalListRef, TokenBalanceListProps>(function TokenBalanceListInner(
  { owner, onPressToken, isExternalProfile = false, ...rest },
  ref,
): JSX.Element {
  return (
    <TokenBalanceListContextProvider isExternalProfile={isExternalProfile} evmOwner={owner} onPressToken={onPressToken}>
      <TokenBalanceListContent
        ref={ref}
        isExternalProfile={isExternalProfile}
        owner={owner}
        onPressToken={onPressToken}
        {...rest}
      />
    </TokenBalanceListContextProvider>
  )
})

const TokenBalanceListContent = forwardRef<UniversalListRef, TokenBalanceListProps>(
  function TokenBalanceListContentInner(
    { empty, containerProps, isExternalProfile = false, renderedInModal = false, refreshing, onRefresh, testID },
    ref,
  ) {
    const colors = useSporeColors()

    usePerformanceLogger(DDRumManualTiming.RenderTokenBalanceList, [])

    const { rows, balancesById } = useTokenBalanceListContext()

    const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    // In order to avoid unnecessary re-renders of the entire list, the `renderItem` function should never change.
    // That's why we use a context provider so that each row can read from there instead of passing down new props every time the data changes.
    const renderItem = useCallback(
      ({ item }: UniversalListRenderItemInfo<TokenBalanceListRow>): JSX.Element => <TokenBalanceItemRow item={item} />,
      [],
    )

    const keyExtractor = useCallback((item: TokenBalanceListRow): string => item, [])

    const ListEmptyComponent = useMemo(() => {
      return (
        <EmptyTokensList
          emptyTokensComponent={
            <Flex grow px="$spacing24">
              {empty}
            </Flex>
          }
          emptyCondition={!!empty}
          errorCardContainerStyle={{ pt: '$spacing24' }}
        />
      )
    }, [empty])

    const ListHeaderComponent = useMemo(() => {
      return <HeaderComponent />
    }, [])

    // add negative z index to prevent footer from covering hidden tokens row when minimized
    const ListFooterComponentStyle = useMemo<UniversalListStyle>(() => ({ style: { zIndex: zIndexes.negative } }), [])

    const contentContainerStyle = useMemo<UniversalListStyle>(
      () => ({ style: containerProps?.contentContainerStyle }),
      [containerProps?.contentContainerStyle],
    )

    const hasData = !!balancesById
    const data = hasData ? rows : EMPTY_ROWS

    // Note: `PerformanceView` must wrap the entire return statement to properly track interactive states.
    return (
      <ReactNavigationPerformanceView
        interactive={hasData}
        screenName={
          // Marks the home screen as interactive when balances are defined
          MobileScreens.Home
        }
      >
        <UniversalList
          ref={ref}
          trackRowViewability
          contentContainerStyle={contentContainerStyle}
          data={data}
          estimatedItemSize={TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          ListFooterComponentStyle={ListFooterComponentStyle}
          ListHeaderComponent={ListHeaderComponent}
          refreshIndicatorColor={colors.neutral3.get()}
          refreshing={refreshing}
          renderItem={renderItem}
          // Route scroll gestures through the sheet's own scrollable when rendered inside one.
          renderScrollComponent={renderedInModal ? BottomSheetScrollView : undefined}
          showsVerticalScrollIndicator={false}
          testID={testID}
          onContentSizeChange={onContentSizeChange}
          onRefresh={onRefresh}
        />
      </ReactNavigationPerformanceView>
    )
  },
)

const HeaderComponent = memo(function HeaderComponentInner(): JSX.Element | null {
  const { t } = useTranslation()
  const { balancesById, error, refetch, isPortfolioBalancesLoading } = useTokenBalanceListContext()

  useAppStateTrigger({ from: 'background', to: 'active', callback: refetch || noop })

  const hasData = !!balancesById
  const hasErrorWithCachedValues = !isPortfolioBalancesLoading && hasData && error !== undefined

  return hasErrorWithCachedValues ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOut} px="$spacing24" py="$spacing8">
      <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
    </AnimatedFlex>
  ) : null
})

export const TokenBalanceItemRow = memo(function TokenBalanceItemRow({ item }: { item: TokenBalanceListRow }) {
  const dispatch = useDispatch()
  // Per-key subscription + poll-stable config, NOT the full list context: its value has a new
  // identity on every portfolio poll, which re-rendered every mounted row (up to `windowSize`
  // screens of them) even when nothing they render changed.
  const balance = useTokenBalanceRowBalance(item)
  const { isWarmLoading } = useTokenBalanceItemConfig()

  // Rows stay mounted well past the viewport; animating all of them exhausted native memory.
  const isViewable = useIsRowViewable(item)

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
    },
    [dispatch],
  )

  const handlePressLearnMore = useCallback((): void => {
    navigate(ModalName.HiddenTokenInfoModal)
  }, [])

  const currencyInfo = balance?.tokens[0]?.currencyInfo

  const contextMenuActions = useMemo(() => {
    if (!currencyInfo) {
      return undefined
    }
    return {
      copyAddressToClipboard,
      openReportTokenModal: (): void => {
        navigate(ModalName.ReportTokenIssue, {
          currency: currencyInfo.currency,
          isMarkedSpam: currencyInfo.isSpam,
          source: 'portfolio',
        })
      },
    }
  }, [copyAddressToClipboard, currencyInfo])

  if (isHiddenTokenBalancesRow(item)) {
    return <HiddenTokensRow onPressLearnMore={handlePressLearnMore} />
  }

  if (!balance || !currencyInfo) {
    // This can happen when the view is out of focus and the user sells/sends 100% of a token's balance.
    // In that case, the token is removed from the balances object, but the FlatList is still using the cached array of IDs until the view comes back into focus.
    // As soon as the view comes back into focus, the FlatList will re-render with the latest data, so users won't really see this Skeleton for more than a few milliseconds when this happens.
    return (
      <Flex height={TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT} px="$spacing24">
        <Loader.Token />
      </Flex>
    )
  }

  return (
    <TokenBalanceItem
      padded
      contextMenuActions={contextMenuActions}
      isLoading={isWarmLoading}
      currencyInfo={currencyInfo}
      portfolioBalance={balance}
      suspendAnimations={!isViewable}
    />
  )
})
