import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { isNonPollingRequestInFlight } from '@universe/api'
import { forwardRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListRenderItemInfo } from 'react-native'
import { Flex, Loader } from 'ui/src'
import { AnimatedBottomSheetFlashList, AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { NoNfts } from 'ui/src/components/icons/NoNfts'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { EMPTY_NFT_ITEM, ESTIMATED_NFT_LIST_ITEM_SIZE, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

const PREFETCH_ITEMS_THRESHOLD = 0.5
const LOADING_ITEM = 'loading'

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

export const NftsList = forwardRef<FlashList<unknown>, NftsListProps>(function _NftsTab(
  {
    owner,
    footerHeight,
    isExternalProfile = false,
    renderedInModal = false,
    errorStateStyle,
    emptyStateStyle,
    customEmptyState,
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

  const {
    nfts,
    numHidden,
    numShown,
    onListEndReached,
    refetch,
    networkStatus,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    isErrorState,
  } = useNftListRenderData({ owner, skip })

  const shouldAddInLoadingItem = networkStatus === NetworkStatus.fetchMore && numShown % 2 === 1

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded && footerHeight) {
      footerHeight.value = fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, footerHeight, setHiddenNftsExpanded, fullHeight])

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
  }, [hiddenNftsExpanded, numHidden, setHiddenNftsExpanded])

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
        isErrorState ? (
          <Flex centered grow style={errorStateStyle}>
            <BaseCard.ErrorState
              description={t('common.error.general')}
              retryButtonLabel={t('common.button.retry')}
              title={t('tokens.nfts.list.error.load.title')}
              onRetry={onRetry}
            />
          </Flex>
        ) : (
          (customEmptyState ?? (
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
          ))
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
