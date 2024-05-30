import { useNftBalance } from 'graphql/data/nft/NftBalance'
import { LoadingAssets } from 'nft/components/collection/CollectionAssetLoading'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import styled from 'styled-components'

import { DEFAULT_NFT_QUERY_AMOUNT } from '../constants'
import { useAccountDrawer } from '../hooks'
import { NFT } from './NFTItem'

export default function NFTs({ account }: { account: string }) {
  const [walletDrawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const { walletAssets, loading, hasNext, loadMore } = useNftBalance(
    account,
    [],
    [],
    DEFAULT_NFT_QUERY_AMOUNT,
    undefined,
    undefined,
    undefined,
    !walletDrawerOpen
  )

  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  if (loading && !walletAssets)
    return (
      <AssetsContainer>
        <LoadingAssets count={2} />
      </AssetsContainer>
    )

  if (!walletAssets || walletAssets?.length === 0) {
    return <EmptyWalletModule onNavigateClick={toggleWalletDrawer} />
  }

  return (
    <InfiniteScroll
      next={loadMore}
      hasMore={hasNext ?? false}
      loader={
        Boolean(hasNext && walletAssets?.length) && (
          <AssetsContainer>
            <LoadingAssets count={2} />
          </AssetsContainer>
        )
      }
      dataLength={walletAssets?.length ?? 0}
      style={{ overflow: 'unset' }}
      scrollableTarget="wallet-dropdown-scroll-wrapper"
    >
      <AssetsContainer>
        {walletAssets?.length
          ? walletAssets.map((asset, index) => {
              return (
                <NFT
                  setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
                  mediaShouldBePlaying={currentTokenPlayingMedia === asset.tokenId}
                  key={index}
                  asset={asset}
                />
              )
            })
          : null}
      </AssetsContainer>
    </InfiniteScroll>
  )
}

const AssetsContainer = styled.div`
  display: grid;
  gap: 12px;

  // use minmax to not let grid items escape the parent container
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin: 16px;
`
