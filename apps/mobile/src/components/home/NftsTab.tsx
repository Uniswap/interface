import { FlashList } from '@shopify/flash-list'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TabProps, TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import { useNFTMenu } from 'src/features/nfts/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import { borderRadii, spacing } from 'ui/src/theme'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { GQLQueries } from 'wallet/src/data/queries'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import {
  ESTIMATED_NFT_LIST_ITEM_SIZE,
  MAX_NFT_IMAGE_SIZE,
} from 'wallet/src/features/nfts/constants'
import { NFTItem } from 'wallet/src/features/nfts/types'

export const NFTS_TAB_DATA_DEPENDENCIES = [GQLQueries.NftsTab]

function NftView({ owner, item }: { owner: Address; item: NFTItem }): JSX.Element {
  const navigation = useAppStackNavigation()
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
    <Flex fill justifyContent="flex-start" m="$spacing4">
      <ContextMenu
        actions={menuActions}
        disabled={menuActions.length === 0}
        style={{ borderRadius: borderRadii.rounded16 }}
        onPress={onContextMenuPress}>
        <TouchableArea
          hapticFeedback
          activeOpacity={1}
          hapticStyle={ImpactFeedbackStyle.Light}
          onPress={onPressItem}>
          <Flex
            alignItems="center"
            aspectRatio={1}
            backgroundColor="$surface3"
            borderRadius="$rounded12"
            overflow="hidden"
            width="100%">
            <NFTViewer
              autoplay
              showSvgPreview
              contractAddress={item.contractAddress}
              imageDimensions={item.imageDimensions}
              limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
              maxHeight={MAX_NFT_IMAGE_SIZE}
              placeholderContent={item.name || item.collectionName}
              squareGridView={true}
              tokenId={item.tokenId}
              uri={item.imageUrl}
            />
          </Flex>
        </TouchableArea>
      </ContextMenu>
    </Flex>
  )
}

export const NftsTab = memo(
  forwardRef<FlashList<unknown>, TabProps>(function _NftsTab(
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
    const colors = useSporeColors()
    const dispatch = useAppDispatch()
    const insets = useSafeAreaInsets()

    const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle
    )

    const onPressScan = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      )
    }

    const renderNFTItem = useCallback(
      (item: NFTItem) => <NftView item={item} owner={owner} />,
      [owner]
    )

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={
            insets.top + (IS_ANDROID && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
          }
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    return (
      <Flex grow px="$spacing12">
        <NftsList
          ref={ref}
          ListFooterComponent={adaptiveFooter}
          emptyStateStyle={{ paddingHorizontal: spacing.spacing12 }}
          errorStateStyle={containerProps?.emptyContainerStyle}
          footerHeight={footerHeight}
          isExternalProfile={isExternalProfile}
          loadingStateStyle={containerProps?.emptyContainerStyle}
          owner={owner}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderNFTItem={renderNFTItem}
          onContentSizeChange={onContentSizeChange}
          onPressEmptyState={onPressScan}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  })
)
