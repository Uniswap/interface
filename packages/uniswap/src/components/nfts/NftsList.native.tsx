import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Flex, UniversalList, type UniversalListRenderItemInfo, Loader } from '@universe/mycelium'
import { NoNfts } from '@universe/mycelium/icons/NoNfts'
import { useDeviceDimensions, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import type { NftsListItem, NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { EMPTY_NFT_ITEM, ESTIMATED_NFT_LIST_ITEM_SIZE, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

// Trigger fetchMore when the user is 30% from the end of the list. Higher values stack
// up multiple in-flight pages plus their image decodes during fast scroll; 0.3 still
// leaves ~9 cells of headroom on a 60-per-page fetch before the user reaches the bottom.
const PREFETCH_ITEMS_THRESHOLD = 0.3
// Off-screen buffer (dp) above and below the viewport. Lower than the engine default
// (250) to bound the number of mounted cells — fewer hydrated images means lower peak
// memory at the cost of more visible blanks during very fast scrolls.
const DRAW_DISTANCE = 150
const LOADING_ITEM = 'loading'

const keyExtractor = (item: NftsListItem): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

export function NftsList({
  ref,
  owner,
  footerHeight,
  isExternalProfile = false,
  renderedInModal = false,
  errorStateStyle,
  emptyStateStyle,
  customEmptyState,
  ListFooterComponent,
  numColumns = 2,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  testID,
  renderNFTItem,
  onContentSizeChange,
  onPressEmptyState,
  onScroll,
  refreshing,
  onRefresh,
  skip,
  filteredNumHidden,
  pollInterval,
  useWindowScroll,
}: NftsListProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { fullHeight } = useDeviceDimensions()

  const {
    nfts,
    numHidden: internalNumHidden,
    numShown,
    onListEndReached,
    refetch,
    isPending,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    isErrorState,
    isFetchingMore,
  } = useNftListRenderData({ owner, skip, pollInterval })

  // Use filtered count if provided, otherwise use internal count
  const numHidden = filteredNumHidden ?? internalNumHidden

  const shouldAddInLoadingItem = isFetchingMore && numShown % 2 === 1

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded && footerHeight) {
      footerHeight.value = fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, footerHeight, setHiddenNftsExpanded, fullHeight])

  // Track NFTs loaded only when initial data loads, not when filtering changes
  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.NFTsLoaded, {
      shown: numShown,
      hidden: internalNumHidden,
    })
  }, [numShown, internalNumHidden])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden, setHiddenNftsExpanded])

  const renderItem = useCallback(
    ({ item, index }: UniversalListRenderItemInfo<NftsListItem>): JSX.Element | null => {
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

  // The hidden-NFTs expander is a full-width row inside the NFT grid, so it spans every column.
  const getItemSpan = useCallback(
    (item: NftsListItem): number | undefined => (item === HIDDEN_NFTS_ROW ? numColumns : undefined),
    [numColumns],
  )

  return (
    <UniversalList
      ref={ref}
      ListEmptyComponent={
        // initial loading
        isPending ? (
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
          {nfts.length > 0 && isFetchingMore && <Loader.NFT repeat={6} />}
          {ListFooterComponent}
        </>
      }
      contentContainerStyle={contentContainerStyle}
      data={shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts}
      drawDistance={DRAW_DISTANCE}
      estimatedItemSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
      // HIDDEN_NFTS_ROW is a constant string, so its cell's (key, item) never change and only
      // extraData can invalidate it — otherwise chevron, label count and press handler all freeze at
      // their first render. `numHidden` belongs here too: it grows as onEndReached pages in more
      // hidden NFTs, and changes when `filteredNumHidden` does. Kept a primitive so the identity
      // comparison holds; an object literal would force a full item-position recalculation on every
      // render, since this list sets both numColumns and getItemSpan.
      extraData={`${hiddenNftsExpanded}-${numHidden}`}
      getItemSpan={getItemSpan}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      refreshIndicatorColor={colors.neutral3.get()}
      refreshing={refreshing}
      renderItem={renderItem}
      // Route scroll gestures through the sheet's own scrollable when rendered inside one.
      renderScrollComponent={renderedInModal ? BottomSheetScrollView : undefined}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      testID={testID}
      useWindowScroll={useWindowScroll}
      onContentSizeChange={onContentSizeChange}
      onEndReached={onListEndReached}
      onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
      onRefresh={onRefresh}
      onScroll={onScroll}
    />
  )
}
