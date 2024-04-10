import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { NftView } from 'src/components/NFT/NftView'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { Screens } from 'src/screens/Screens'
import { Flex, useDeviceInsets, useSporeColors } from 'ui/src'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { isAndroid } from 'uniswap/src/utils/platform'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
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
    const insets = useDeviceInsets()
    const navigation = useAppStackNavigation()

    const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle
    )

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
            insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
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
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  })
)
