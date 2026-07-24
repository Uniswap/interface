import type { FlashListRef } from '@shopify/flash-list'
import { isAndroid } from '@universe/environment'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { Flex, useSporeColors } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export const NftsTab = memo(
  forwardRef<FlashListRef<unknown>, TabProps>(function NftsTabInner(
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

    // `useAccounts()` returns a new object reference on every Redux dispatch even when
    // the address set is unchanged. Memoizing on the joined keys keeps `walletAddresses`
    // referentially stable so `renderNFTItem` doesn't churn the FlashList every render.
    const accountsKey = Object.keys(accounts).sort().join(',')
    // oxlint-disable-next-line react/exhaustive-deps -- intentionally keying on accountsKey to skip identity-only changes to accounts
    const walletAddresses = useMemo(() => Object.keys(accounts).sort(), [accountsKey])

    const renderNFTItem = useCallback(
      (item: NFTItem, index: number) => {
        const onPressNft = async (): Promise<void> => {
          const nftDetails = {
            chainId: item.chainId ?? defaultChainId,
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
              walletAddresses={walletAddresses}
              onPress={onPressNft}
            />
          </Flex>
        )
      },
      [owner, walletAddresses, defaultChainId, navigateToNftExplorerLink],
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
