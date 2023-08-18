import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, RefreshControl, View } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { TabProps, TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { HiddenNftsRowLeft, HiddenNftsRowRight } from 'src/components/NFT/NFTHiddenRow'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import {
  EMPTY_NFT_ITEM,
  HIDDEN_NFTS_ROW_LEFT_ITEM,
  HIDDEN_NFTS_ROW_RIGHT_ITEM,
  useGroupNftsByVisibility,
  useNFTMenu,
} from 'src/features/nfts/hooks'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import NoNFTsIcon from 'ui/src/assets/icons/empty-state-picture.svg'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { GQLQueries } from 'wallet/src/data/queries'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { NftsTabQuery, useNftsTabQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

export const NFTS_TAB_DATA_DEPENDENCIES = [GQLQueries.NftsTab]

const MAX_NFT_IMAGE_SIZE = 375
const ESTIMATED_ITEM_SIZE = 251 // heuristic provided by FlashList
const PREFETCH_ITEMS_THRESHOLD = 0.5
const LOADING_ITEM = 'loading'

function formatNftItems(data: NftsTabQuery | undefined): NFTItem[] | undefined {
  const items = data?.nftBalances?.edges?.flatMap((item) => item.node)
  if (!items) return

  const nfts = items
    .filter((item) => item?.ownedAsset?.nftContract?.address && item?.ownedAsset?.tokenId)
    .map((item): NFTItem => {
      return {
        name: item?.ownedAsset?.name ?? undefined,
        description: item?.ownedAsset?.description ?? undefined,
        contractAddress: item?.ownedAsset?.nftContract?.address ?? undefined,
        tokenId: item?.ownedAsset?.tokenId ?? undefined,
        imageUrl: item?.ownedAsset?.image?.url ?? undefined,
        collectionName: item?.ownedAsset?.collection?.name ?? undefined,
        isVerifiedCollection: item?.ownedAsset?.collection?.isVerified ?? undefined,
        floorPrice: item?.ownedAsset?.collection?.markets?.[0]?.floorPrice?.value ?? undefined,
        isSpam: item?.ownedAsset?.isSpam ?? undefined,
        imageDimensions:
          item?.ownedAsset?.image?.dimensions?.height && item?.ownedAsset?.image?.dimensions?.width
            ? {
                width: item?.ownedAsset?.image.dimensions.width,
                height: item?.ownedAsset?.image.dimensions.height,
              }
            : undefined,
      }
    })
  return nfts
}

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

function NftView({ owner, item }: { owner: Address; item: NFTItem }): JSX.Element {
  const navigation = useAppStackNavigation()
  const theme = useAppTheme()
  const onPressItem = useCallback(() => {
    navigation.navigate(Screens.NFTItem, {
      owner,
      address: item.contractAddress ?? '',
      tokenId: item.tokenId ?? '',
      isSpam: item.isSpam,
      fallbackData: item,
    })
  }, [item, navigation, owner])

  const { menuActions, onContextMenuPress } = useNFTMenu({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    isSpam: item.isSpam,
  })

  return (
    <Box flex={1} justifyContent="flex-start" m="spacing4">
      <ContextMenu
        actions={menuActions}
        disabled={menuActions.length === 0}
        style={{ borderRadius: theme.borderRadii.rounded16 }}
        onPress={onContextMenuPress}>
        <TouchableArea
          hapticFeedback
          activeOpacity={1}
          hapticStyle={ImpactFeedbackStyle.Light}
          onPress={onPressItem}>
          <Box
            alignItems="center"
            aspectRatio={1}
            backgroundColor="surface3"
            borderRadius="rounded12"
            overflow="hidden"
            width="100%">
            <NFTViewer
              imageDimensions={item.imageDimensions}
              limitGIFSize={ESTIMATED_ITEM_SIZE}
              maxHeight={MAX_NFT_IMAGE_SIZE}
              placeholderContent={item.name || item.collectionName}
              squareGridView={true}
              uri={item.imageUrl ?? ''}
            />
          </Box>
        </TouchableArea>
      </ContextMenu>
    </Box>
  )
}

export const NftsTab = forwardRef<FlashList<unknown>, TabProps>(function _NftsTab(
  {
    owner,
    containerProps,
    scrollHandler,
    isExternalProfile = false,
    refreshing,
    onRefresh,
    headerHeight = 0,
  },
  ref
) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
    containerProps?.contentContainerStyle
  )

  const { data, fetchMore, refetch, networkStatus } = useNftsTabQuery({
    variables: { ownerAddress: owner, first: 30, filter: { filterSpam: false } },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
  })

  const nftDataItems = formatNftItems(data)
  const shouldAddInLoadingItem =
    networkStatus === NetworkStatus.fetchMore && nftDataItems && nftDataItems.length % 2 === 1

  const onListEndReached = useCallback(async () => {
    if (!data?.nftBalances?.pageInfo?.hasNextPage) return

    await fetchMore({
      variables: {
        first: 30,
        after: data?.nftBalances?.pageInfo?.endCursor,
      },
    })
  }, [data?.nftBalances?.pageInfo?.endCursor, data?.nftBalances?.pageInfo?.hasNextPage, fetchMore])

  const onPressScan = (): void => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  const { nfts, numHidden } = useGroupNftsByVisibility(nftDataItems, hiddenNftsExpanded, owner)

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded) {
      footerHeight.value = dimensions.fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, footerHeight])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string | NFTItem>) => {
      if (typeof item !== 'string') {
        return <NftView item={item} owner={owner} />
      }
      switch (item) {
        case LOADING_ITEM:
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
    [hiddenNftsExpanded, numHidden, onHiddenRowPressed, owner]
  )

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl
        progressViewOffset={
          insets.top + (IS_ANDROID && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
        }
        refreshing={refreshing ?? false}
        tintColor={theme.colors.neutral3}
        onRefresh={onRefresh}
      />
    )
  }, [refreshing, headerHeight, onRefresh, theme.colors.neutral3, insets.top])

  const onRetry = useCallback(() => refetch(), [refetch])

  return (
    <Flex grow px="spacing12">
      <AnimatedFlashList
        ref={ref}
        ListEmptyComponent={
          // initial loading
          isNonPollingRequestInFlight(networkStatus) ? (
            <View style={{ paddingHorizontal: theme.spacing.spacing12 }}>
              <Loader.NFT repeat={6} />
            </View>
          ) : // no response and we're not loading already
          isError(networkStatus, !!data) ? (
            <Flex grow style={containerProps?.emptyContainerStyle}>
              <BaseCard.ErrorState
                description={t('Something went wrong.')}
                retryButtonLabel={t('Retry')}
                title={t('Couldn’t load NFTs')}
                onRetry={onRetry}
              />
            </Flex>
          ) : (
            // empty view
            <Box flexGrow={1} style={containerProps?.emptyContainerStyle}>
              <BaseCard.EmptyState
                buttonLabel={isExternalProfile ? undefined : t('Receive NFTs')}
                description={
                  isExternalProfile
                    ? t('When this wallet buys or receives NFTs, they’ll appear here.')
                    : t('Transfer NFTs from another wallet to get started.')
                }
                icon={<NoNFTsIcon color={theme.colors.neutral3} />}
                title={t('No NFTs yet')}
                onPress={onPressScan}
              />
            </Box>
          )
        }
        // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
        ListFooterComponent={
          <>
            {networkStatus === NetworkStatus.fetchMore && <Loader.NFT repeat={4} />}
            {adaptiveFooter}
          </>
        }
        data={shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        keyExtractor={keyExtractor}
        numColumns={2}
        refreshControl={refreshControl}
        refreshing={refreshing}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onEndReached={onListEndReached}
        onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
        onRefresh={onRefresh}
        onScroll={scrollHandler}
        {...containerProps}
      />
    </Flex>
  )
})
