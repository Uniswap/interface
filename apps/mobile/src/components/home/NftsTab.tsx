import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { Flex, useSporeColors } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

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
    ref,
  ) {
    const colors = useSporeColors()
    const insets = useAppInsets()
    const navigation = useAppStackNavigation()
    const accounts = useAccounts()

    const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle,
    )

    const renderNFTItem = useCallback(
      (item: NFTItem, index: number) => {
        const onPressNft = (): void => {
          navigation.navigate(MobileScreens.NFTItem, {
            owner,
            address: item.contractAddress ?? '',
            tokenId: item.tokenId ?? '',
            isSpam: item.isSpam,
            fallbackData: item,
          })
        }

        return (
          <Flex m="$spacing4">
            <NftViewWithContextMenu
              index={index}
              item={item}
              owner={owner}
              walletAddresses={Object.keys(accounts)}
              onPress={onPressNft}
            />
          </Flex>
        )
      },
      [owner, navigation, accounts],
    )

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)}
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    return (
      <Flex grow px="$spacing12" testID={TestID.NFTsTab}>
        <NftsList
          ref={ref}
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          emptyStateStyle={containerProps?.emptyComponentStyle}
          errorStateStyle={containerProps?.emptyComponentStyle}
          footerHeight={footerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderNFTItem={renderNFTItem}
          renderedInModal={renderedInModal}
          onContentSizeChange={onContentSizeChange}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  }),
)
