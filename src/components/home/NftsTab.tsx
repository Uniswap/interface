import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { forwardRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import NoNFTsIcon from 'src/assets/icons/empty-state-picture.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { TabContentProps } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'src/data/utils'
import { NftsTabQuery, useNftsTabQuery } from 'src/data/__generated__/types-and-hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'

const MAX_NFT_IMAGE_SIZE = 375
const ESTIMATED_ITEM_SIZE = 251 // heuristic provided by FlashList
const PREFETCH_ITEMS_THRESHOLD = 0.5
const LOADING_ITEM = 'loading'
const FOOTER_HEIGHT = 20

type NftsTabProps = {
  owner: string
  containerProps?: TabContentProps
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

function formatNftItems(data: NftsTabQuery | undefined): NFTItem[] {
  const items = data?.nftBalances?.edges?.flatMap((item) => item.node)
  if (!items) return EMPTY_ARRAY
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
      }
    })
  return nfts
}

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string'
    ? LOADING_ITEM
    : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

export const NftsTab = forwardRef<FlashList<unknown>, NftsTabProps>(
  ({ owner, containerProps, scrollHandler }, ref) => {
    const navigation = useAppStackNavigation()
    const { t } = useTranslation()
    const theme = useAppTheme()
    const dispatch = useAppDispatch()

    const { data, fetchMore, refetch, networkStatus } = useNftsTabQuery({
      variables: { ownerAddress: owner, first: 30 },
      notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
      errorPolicy: 'all', // Suppress non-null image.url fields from backend
    })

    const nftDataItems = formatNftItems(data)
    const shouldAddInLoadingItem =
      networkStatus === NetworkStatus.fetchMore && nftDataItems.length % 2 === 1

    const onListEndReached = useCallback(() => {
      if (!data?.nftBalances?.pageInfo?.hasNextPage) return

      fetchMore({
        variables: {
          first: 30,
          after: data?.nftBalances?.pageInfo?.endCursor,
        },
      })
    }, [
      data?.nftBalances?.pageInfo?.endCursor,
      data?.nftBalances?.pageInfo?.hasNextPage,
      fetchMore,
    ])

    const onPressItem = useCallback(
      (asset: NFTItem) => {
        navigation.navigate(Screens.NFTItem, {
          owner,
          address: asset.contractAddress ?? '',
          tokenId: asset.tokenId ?? '',
        })
      },
      [navigation, owner]
    )

    const onPressScan = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      )
    }

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<string | NFTItem>) => {
        return typeof item === 'string' ? (
          <Loader.NFT />
        ) : (
          <Box flex={1} justifyContent="flex-start" m="spacing4">
            <TouchableArea
              hapticFeedback
              activeOpacity={1}
              hapticStyle={ImpactFeedbackStyle.Light}
              onPress={(): void => onPressItem(item)}>
              <Box
                alignItems="center"
                aspectRatio={1}
                backgroundColor="backgroundOutline"
                borderRadius="rounded12"
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ overflow: 'hidden' }}
                width="100%">
                <NFTViewer
                  maxHeight={MAX_NFT_IMAGE_SIZE}
                  placeholderContent={item.name || item.collectionName}
                  squareGridView={true}
                  uri={item.imageUrl ?? ''}
                />
              </Box>
            </TouchableArea>
          </Box>
        )
      },
      [onPressItem]
    )

    /**
     * If tab container is smaller than the approximate screen height, we need to manually add
     * padding so scroll works as intended since minHeight is not supported by FlashList in
     * `contentContainerStyle`. Padding is proportional to the number of rows the data items take up.
     */
    const footerPadding =
      nftDataItems.length < 6
        ? (ESTIMATED_ITEM_SIZE * (6 - nftDataItems.length)) / 2
        : FOOTER_HEIGHT

    const onRetry = useCallback(() => refetch(), [refetch])

    if (isError(networkStatus, !!data)) {
      return (
        <Flex grow style={containerProps?.emptyContainerStyle}>
          <BaseCard.ErrorState
            description={t('Something went wrong.')}
            retryButtonLabel={t('Retry')}
            title={t('Couldn’t load NFTs')}
            onRetry={onRetry}
          />
        </Flex>
      )
    }

    // Initial loading state or refetch
    if (isNonPollingRequestInFlight(networkStatus)) {
      return (
        <View style={containerProps?.loadingContainerStyle}>
          <Flex>
            <Loader.NFT repeat={6} />
          </Flex>
        </View>
      )
    }

    return nftDataItems.length === 0 ? (
      <Flex centered grow flex={1} style={containerProps?.emptyContainerStyle}>
        <BaseCard.EmptyState
          buttonLabel={t('Receive NFTs')}
          description={t('Transfer NFTs from another wallet to get started.')}
          icon={<NoNFTsIcon color={theme.colors.textSecondary} />}
          title={t('No NFTs yet')}
          onPress={onPressScan}
        />
      </Flex>
    ) : (
      <Flex grow px="spacing12">
        <AnimatedFlashList
          ref={ref}
          ListFooterComponent={
            // If not loading, we add a footer  to cover any possible space that is covered up by bottom tab bar
            networkStatus === NetworkStatus.fetchMore ? (
              <Loader.NFT repeat={4} />
            ) : (
              <Box height={footerPadding} />
            )
          }
          data={shouldAddInLoadingItem ? [...nftDataItems, LOADING_ITEM] : nftDataItems}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          keyExtractor={keyExtractor}
          numColumns={2}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={onListEndReached}
          onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  }
)
