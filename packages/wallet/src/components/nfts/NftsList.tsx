import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { ComponentProps, CSSProperties, forwardRef, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import {
  AnimatedBottomSheetFlashList,
  AnimatedFlashList,
  Flex,
  Icons,
  Loader,
  useDeviceDimensions,
  useSporeColors,
} from 'ui/src'
import { useNftsTabQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { HiddenNftsRowLeft, HiddenNftsRowRight } from 'wallet/src/components/nfts/NFTHiddenRow'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import {
  EMPTY_NFT_ITEM,
  ESTIMATED_NFT_LIST_ITEM_SIZE,
  HIDDEN_NFTS_ROW_LEFT_ITEM,
  HIDDEN_NFTS_ROW_RIGHT_ITEM,
} from 'wallet/src/features/nfts/constants'
import { useGroupNftsByVisibility } from 'wallet/src/features/nfts/hooks'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { formatNftItems, getNFTAssetKey } from 'wallet/src/features/nfts/utils'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'

export const NFTS_TAB_DATA_DEPENDENCIES = [GQLQueries.NftsTab]
export const NUM_FIRST_NFTS = 30

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
      renderNFTItem: (item: NFTItem) => JSX.Element
      onPressEmptyState?: () => void
      loadingStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
      errorStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
      emptyStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
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
    ...rest
  },
  ref
) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { fullHeight } = useDeviceDimensions()

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const { data, fetchMore, refetch, networkStatus } = useNftsTabQuery({
    variables: { ownerAddress: owner, first: NUM_FIRST_NFTS, filter: { filterSpam: false } },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
  })

  const nftDataItems = formatNftItems(data)
  const shouldAddInLoadingItem =
    networkStatus === NetworkStatus.fetchMore && nftDataItems && nftDataItems.length % 2 === 1

  const onListEndReached = useCallback(async () => {
    if (!data?.nftBalances?.pageInfo?.hasNextPage) {
      return
    }

    await fetchMore({
      variables: {
        first: 30,
        after: data?.nftBalances?.pageInfo?.endCursor,
      },
    })
  }, [data?.nftBalances?.pageInfo?.endCursor, data?.nftBalances?.pageInfo?.hasNextPage, fetchMore])

  const { nfts, numHidden, numShown } = useGroupNftsByVisibility(
    nftDataItems,
    hiddenNftsExpanded,
    owner
  )

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded && footerHeight) {
      footerHeight.value = fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, footerHeight, fullHeight])

  useEffect(() => {
    sendWalletAnalyticsEvent(WalletEventName.NFTsLoaded, {
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
    ({ item }: ListRenderItemInfo<string | NFTItem>) => {
      if (typeof item !== 'string') {
        return renderNFTItem(item)
      }
      switch (item) {
        case LOADING_ITEM:
          // This case probably never occurs
          return <Loader.NFT />
        case EMPTY_NFT_ITEM:
          return null
        case HIDDEN_NFTS_ROW_LEFT_ITEM:
          return <HiddenNftsRowLeft numHidden={numHidden} />
        case HIDDEN_NFTS_ROW_RIGHT_ITEM:
          return <HiddenNftsRowRight isExpanded={hiddenNftsExpanded} onPress={onHiddenRowPressed} />
        default:
          return null
      }
    },
    [hiddenNftsExpanded, numHidden, onHiddenRowPressed, renderNFTItem]
  )

  const onRetry = useCallback(() => refetch(), [refetch])

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
          <Flex centered grow style={emptyStateStyle}>
            <BaseCard.EmptyState
              buttonLabel={
                isExternalProfile || !onPressEmptyState
                  ? undefined
                  : t('tokens.nfts.list.none.button')
              }
              description={
                isExternalProfile
                  ? t('tokens.nfts.list.none.description.external')
                  : t('tokens.nfts.list.none.description.default')
              }
              icon={
                <Flex pb="$spacing12">
                  <Icons.EmptyStatePicture color={colors.neutral3.get()} size="$icon.70" />
                </Flex>
              }
              title={t('tokens.nfts.list.none.title')}
              onPress={onPressEmptyState}
            />
          </Flex>
        )
      }
      // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
      ListFooterComponent={
        <>
          {networkStatus === NetworkStatus.fetchMore && <Loader.NFT repeat={6} />}
          {ListFooterComponent}
        </>
      }
      data={shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts}
      estimatedItemSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
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
