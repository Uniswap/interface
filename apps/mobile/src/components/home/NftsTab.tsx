import { Flex, type UniversalListRef, type UniversalListStyle } from '@universe/mycelium'
import { TestID } from '@universe/test'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { TabProps } from 'src/components/layout/TabHelpers'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export const NftsTab = memo(
  forwardRef<UniversalListRef, TabProps>(function NftsTabInner(
    { owner, containerProps, isExternalProfile = false, refreshing, onRefresh, renderedInModal = false },
    ref,
  ) {
    const accounts = useAccounts()
    const { defaultChainId } = useEnabledChains()
    const navigateToNftExplorerLink = useNavigateToNftExplorerLink()

    const { onContentSizeChange, footerHeight, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle,
    )

    // `useAccounts()` returns a new object reference on every Redux dispatch even when
    // the address set is unchanged. Memoizing on the joined keys keeps `walletAddresses`
    // referentially stable so `renderNFTItem` does not churn the list every render.
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

    const contentContainerStyle = useMemo<UniversalListStyle>(
      () => ({ style: containerProps?.contentContainerStyle }),
      [containerProps?.contentContainerStyle],
    )

    return (
      <Flex grow px="$spacing12" testID={TestID.NFTsTab}>
        <NftsList
          ref={ref}
          contentContainerStyle={contentContainerStyle}
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          emptyStateStyle={containerProps?.emptyComponentStyle}
          errorStateStyle={containerProps?.emptyComponentStyle}
          footerHeight={footerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshing={refreshing}
          renderNFTItem={renderNFTItem}
          renderedInModal={renderedInModal}
          onContentSizeChange={onContentSizeChange}
          onRefresh={onRefresh}
        />
      </Flex>
    )
  }),
)
