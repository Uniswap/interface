import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TabProps, TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { NftView } from 'src/components/NFT/NftView'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { Flex, useDeviceInsets, useSporeColors } from 'ui/src'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { GQLQueries } from 'wallet/src/data/queries'
import { NFTItem } from 'wallet/src/features/nfts/types'

export const NFTS_TAB_DATA_DEPENDENCIES = [GQLQueries.NftsTab]

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
      renderedInModal = false,
    },
    ref
  ) {
    const colors = useSporeColors()
    const dispatch = useAppDispatch()
    const insets = useDeviceInsets()
    const navigation = useAppStackNavigation()

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
      (item: NFTItem) => {
        const onPressNft = (): void => {
          navigation.navigate(Screens.NFTItem, {
            owner,
            address: item.contractAddress ?? '',
            tokenId: item.tokenId ?? '',
            isSpam: item.isSpam,
            fallbackData: item,
          })
        }

        return <NftView item={item} owner={owner} onPress={onPressNft} />
      },
      [owner, navigation]
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
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          emptyStateStyle={containerProps?.emptyContainerStyle}
          errorStateStyle={containerProps?.emptyContainerStyle}
          footerHeight={footerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderNFTItem={renderNFTItem}
          renderedInModal={renderedInModal}
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
