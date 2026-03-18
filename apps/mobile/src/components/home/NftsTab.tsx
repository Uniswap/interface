import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { Flex, useSporeColors } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
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
    const accounts = useAccounts()
    const { defaultChainId } = useEnabledChains()
    const navigateToNftExplorerLink = useNavigateToNftExplorerLink()

    const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle,
    )

    const renderNFTItem = useCallback(
      (item: NFTItem, index: number) => {
        const onPressNft = async (): Promise<void> => {
          const nftDetails = {
            chainId: fromGraphQLChain(item.chain) ?? defaultChainId,
            contractAddress: item.contractAddress ?? '',
            tokenId: item.tokenId ?? '',
          }
          const openseaUrl = getOpenseaLink(nftDetails)

          if (openseaUrl) {
            await openUri({ uri: openseaUrl })
          } else {
            navigateToNftExplorerLink(nftDetails)
          }
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
      [owner, accounts, defaultChainId, navigateToNftExplorerLink],
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
