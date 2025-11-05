import { useAuctionBlockPolling } from 'components/Toucan/Auction/hooks/useAuctionBlockPolling'
import { AuctionStoreContext } from 'components/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from 'components/Toucan/Auction/store/createAuctionStore'
import { useAuctionStore, useAuctionStoreActions } from 'components/Toucan/Auction/store/useAuctionStore'
import { useSrcColor } from 'hooks/useColor'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useSporeColors } from 'ui/src'

function useUpdateTokenColorInAuctionStore() {
  const colors = useSporeColors()

  const { setTokenColor } = useAuctionStoreActions()
  const { logoUrl, tokenName } = useAuctionStore((state) => ({
    logoUrl: state.auctionDetails?.logoUrl,
    tokenName: state.auctionDetails?.tokenName,
  }))

  const { tokenColor } = useSrcColor({
    src: logoUrl,
    currencyName: tokenName,
    backgroundColor: colors.surface2.val,
  })

  useEffect(() => {
    if (tokenColor) {
      setTokenColor(tokenColor)
    }
  }, [tokenColor, setTokenColor])
}

function AuctionStoreProviderInner({ children }: PropsWithChildren) {
  useUpdateTokenColorInAuctionStore()

  const { chainId, endBlock } = useAuctionStore((state) => ({
    chainId: state.auctionDetails?.chainId,
    endBlock: state.auctionDetails?.endBlock,
  }))

  useAuctionBlockPolling(chainId, endBlock)

  return children
}

export function AuctionStoreProvider({ children }: PropsWithChildren) {
  const { id } = useParams<{ id: string }>()

  const [store] = useState(() => createAuctionStore(id))

  return (
    <AuctionStoreContext.Provider value={store}>
      <AuctionStoreProviderInner>{children}</AuctionStoreProviderInner>
    </AuctionStoreContext.Provider>
  )
}
