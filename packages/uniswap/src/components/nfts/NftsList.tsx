import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { ComponentProps, CSSProperties, forwardRef, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { Flex, Loader } from 'ui/src'
import { AnimatedBottomSheetFlashList, AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { NoNfts } from 'ui/src/components/icons/NoNfts'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { useNftsTabQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { isError, isNonPollingRequestInFlight } from 'uniswap/src/data/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EMPTY_NFT_ITEM, ESTIMATED_NFT_LIST_ITEM_SIZE, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { useGroupNftsByVisibility } from 'uniswap/src/features/nfts/hooks/useGroupNftsByVisibility'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { formatNftItems, getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export const NFTS_TAB_DATA_DEPENDENCIES = [GQLQueries.NftsTab]
export const NUM_FIRST_NFTS = 100

const PREFETCH_ITEMS_THRESHOLD = 0.5
const LOADING_ITEM = 'loading'

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

type NftsListProps = Omit<
  Omit<
    ComponentProps<typeof AnimatedFlashList> & {
      owner: Address
      footerHeight?: SharedValue<number>
      isExternalProfile?: boolean
      renderedInModal?: boolean
      renderNFTItem: (item: NFTItem, index: number) => JSX.Element
      onPressEmptyState?: () => void
      loadingStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
      errorStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
      emptyStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
      skip?: boolean
    },
    'renderItem'
  >,
  'data'
>

export const NftsList = forwardRef<FlashList<unknown>, NftsListProps>(function _NftsTab(
  {
    owner,
    footerHeight,
    isExternalProfile = false,
    renderedInModal = false,
    errorStateStyle,
    emptyStateStyle,
    ListFooterComponent,
    numColumns = 2,
    renderNFTItem,
    refreshControl,
    onContentSizeChange,
    onPressEmptyState,
    onScroll,
    refreshing,
    onRefresh,
    skip,
    ...rest
  },
  ref,
) {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const { gqlChains } = useEnabledChains()

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const { data, fetchMore, refetch, networkStatus } = useNftsTabQuery({
    variables: {
      ownerAddress: owner,
      first: NUM_FIRST_NFTS,
      filter: { filterSpam: false },
      chains: gqlChains,
    },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    skip,
  })

  const nftDataItems = formatNftItems(data)

  const onListEndReached = useCallback(async () => {
    if (!data?.nftBalances?.pageInfo.hasNextPage) {
      return
    }

    await fetchMore({
      variables: {
        first: NUM_FIRST_NFTS,
        after: data.nftBalances.pageInfo.endCursor,
      },
    })
  }, [data?.nftBalances?.pageInfo.endCursor, data?.nftBalances?.pageInfo.hasNextPage, fetchMore])

  const { nfts, numHidden, numShown } = useGroupNftsByVisibility({
    nftDataItems,
    showHidden: hiddenNftsExpanded,
    allPagesFetched: !data?.nftBalances?.pageInfo.hasNextPage,
  })

  const shouldAddInLoadingItem = networkStatus === NetworkStatus.fetchMore && numShown % 2 === 1

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded && footerHeight) {
      footerHeight.value = fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, footerHeight, fullHeight])

  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.NFTsLoaded, {
      shown: numShown,
      hidden: numHidden,
    })
  }, [numHidden, numShown])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden])

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<string | NFTItem>) => {
      if (typeof item !== 'string') {
        return renderNFTItem(item, index)
      }

      switch (item) {
        case LOADING_ITEM:
          // This case probably never occurs
          return <Loader.NFT />
        case EMPTY_NFT_ITEM:
          return null
        case HIDDEN_NFTS_ROW:
          return (
            <Flex grow>
              <ExpandoRow
                isExpanded={hiddenNftsExpanded}
                label={t('hidden.nfts.info.text.button', { numHidden })}
                mx="$spacing4"
                onPress={onHiddenRowPressed}
              />
              {hiddenNftsExpanded && <ShowNFTModal />}
            </Flex>
          )

        default:
          return null
      }
    },
    [hiddenNftsExpanded, numHidden, onHiddenRowPressed, renderNFTItem, t],
  )

  const onRetry = useCallback(() => refetch(), [refetch])

  const renderLayout = useCallback((layout: { span?: number }, item: string | NFTItem) => {
    if (item === HIDDEN_NFTS_ROW) {
      layout.span = 2
    }

    return layout
  }, [])

  const List = renderedInModal ? AnimatedBottomSheetFlashList : AnimatedFlashList

  return (
    <List
      {...rest}
      ref={ref}
      ListEmptyComponent={
        // initial loading
        isNonPollingRequestInFlight(networkStatus) ? (
          <Loader.NFT repeat={6} />
        ) : // no response and we're not loading already
        isError(networkStatus, !!data) ? (
          <Flex centered grow style={errorStateStyle}>
            <BaseCard.ErrorState
              description={t('common.error.general')}
              retryButtonLabel={t('common.button.retry')}
              title={t('tokens.nfts.list.error.load.title')}
              onRetry={onRetry}
            />
          </Flex>
        ) : (
          // empty view
          <Flex centered pt="$spacing48" px="$spacing36" style={emptyStateStyle}>
            <BaseCard.EmptyState
              buttonLabel={isExternalProfile || !onPressEmptyState ? undefined : t('tokens.nfts.list.none.button')}
              description={
                isExternalProfile
                  ? t('tokens.nfts.list.none.description.external')
                  : t('tokens.nfts.list.none.description.default')
              }
              icon={<NoNfts color="$neutral3" size="$icon.100" />}
              title={t('tokens.nfts.list.none.title')}
              onPress={onPressEmptyState}
            />
          </Flex>
        )
      }
      // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
      ListFooterComponent={
        <>
          {nfts.length > 0 && networkStatus === NetworkStatus.fetchMore && <Loader.NFT repeat={6} />}
          {ListFooterComponent}
        </>
      }
      data={shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts}
      estimatedItemSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      overrideItemLayout={renderLayout}
      refreshControl={refreshControl}
      refreshing={refreshing}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={onContentSizeChange}
      onEndReached={onListEndReached}
      onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
      onRefresh={onRefresh}
      onScroll={onScroll}
    />
  )
})
