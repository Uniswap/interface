import { useIsFocused } from '@react-navigation/core'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import NoNFTsIcon from 'src/assets/icons/empty-state-picture.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { NfTsTabQueryQuery, useNfTsTabQueryQuery } from 'src/data/__generated__/types-and-hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { formatNumber, NumberType } from 'src/utils/format'

const MAX_NFT_IMAGE_SIZE = 375
const ESTIMATED_ITEM_SIZE = 100
const PREFETCH_ITEMS_THRESHOLD = 0.5
const LOADING_ITEM = 'loading'
const FOOTER_HEIGHT = 20

function formatNftItems(data: NfTsTabQueryQuery | undefined): NFTItem[] {
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

const keyExtractor = (item: NFTItem | string) =>
  typeof item === 'string'
    ? LOADING_ITEM
    : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

export function NftsTab({
  owner,
  tabViewScrollProps,
  loadingContainerStyle,
}: {
  owner: string
  tabViewScrollProps?: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}) {
  const navigation = useHomeStackNavigation()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const [isSwitchingAccounts, setIsSwitchingAccounts] = useState(false)

  const { data, loading, fetchMore, refetch } = useNfTsTabQueryQuery({
    variables: { ownerAddress: owner, first: 50 },
    notifyOnNetworkStatusChange: true, // Used to trigger `loading` state on fetchMore request
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    onCompleted: () => {
      setIsSwitchingAccounts(false)
    },
  })

  /**
   * When owner changes, we need to trigger a refetch due to useRelayPagination policy ignoring key argument changes
   * This only needs to be done if owner changes AND refetch callback already exists.
   * We need to use the `setIsSwitchingAccounts` state in order to trigger loading state on switching accounts.
   * If not, it will incorrectly display the old account's content until the refetch completes.
   */
  const isFocused = useIsFocused()
  useEffect(() => {
    if (!refetch || !isFocused) return
    setIsSwitchingAccounts(true)
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  const nftDataItems = formatNftItems(data)
  const shouldAddInLoadingItem = loading && nftDataItems.length % 2 === 1

  const onListEndReached = () => {
    if (!data?.nftBalances?.pageInfo?.hasNextPage) return

    fetchMore({
      variables: {
        first: 50,
        after: data?.nftBalances?.pageInfo?.endCursor,
      },
    })
  }

  const onPressItem = useCallback(
    (asset: NFTItem) => {
      navigation.navigate(Screens.NFTItem, {
        owner: owner,
        address: asset.contractAddress ?? '',
        tokenId: asset.tokenId ?? '',
      })
    },
    [navigation, owner]
  )

  const onPressScan = () => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string | NFTItem>) => {
      return typeof item === 'string' ? (
        <Loading repeat={1} type="nft" />
      ) : (
        <Box flex={1} justifyContent="flex-start" m="xs">
          <TouchableArea activeOpacity={1} onPress={() => onPressItem(item)}>
            <Box
              alignItems="center"
              aspectRatio={1}
              backgroundColor="backgroundOutline"
              borderRadius="md"
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
            <Flex gap="none" py="xs">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
                {item.name}
              </Text>
              <Flex row alignItems="center" gap="xs" justifyContent="flex-start">
                <Flex row shrink>
                  <Text ellipsizeMode="tail" numberOfLines={1} variant="bodySmall">
                    {item.collectionName}
                  </Text>
                </Flex>
                {item.isVerifiedCollection && (
                  <VerifiedIcon color={theme.colors.userThemeMagenta} height={16} width={16} />
                )}
              </Flex>
              {item.floorPrice && (
                <Text
                  color="textSecondary"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  variant="bodySmall">
                  {formatNumber(item.floorPrice, NumberType.NFTTokenFloorPrice)} ETH
                </Text>
              )}
            </Flex>
          </TouchableArea>
        </Box>
      )
    },
    [onPressItem, theme.colors.userThemeMagenta]
  )

  // Initial loading state
  if ((!data || isSwitchingAccounts) && loading) {
    return (
      <View style={loadingContainerStyle}>
        <Flex pt="sm">
          <Loading repeat={6} type="nft" />
        </Flex>
      </View>
    )
  }

  return nftDataItems.length === 0 ? (
    <Flex centered flex={1} style={loadingContainerStyle}>
      <BaseCard.EmptyState
        buttonLabel={t('Receive NFTs')}
        description={t('Transfer NFTs from another wallet to get started.')}
        icon={<NoNFTsIcon color={theme.colors.textSecondary} />}
        title={t('No NFTs yet')}
        onPress={onPressScan}
      />
    </Flex>
  ) : (
    <Flex flexGrow={1} paddingHorizontal="xs" paddingTop="sm">
      <FlashList
        ref={tabViewScrollProps?.ref}
        ListFooterComponent={
          // If not loading, we add a footer  to cover any possible space that is covered up by bottom tab bar
          loading ? <Loading repeat={4} type="nft" /> : <Box height={FOOTER_HEIGHT} />
        }
        contentContainerStyle={tabViewScrollProps?.contentContainerStyle}
        data={shouldAddInLoadingItem ? [...nftDataItems, LOADING_ITEM] : nftDataItems}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={onListEndReached}
        onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
        onScroll={tabViewScrollProps?.onScroll}
      />
    </Flex>
  )
}
