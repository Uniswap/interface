import { onlineManager } from '@tanstack/react-query'
import { isEVMChain, normalizeTokenAddressForCache } from '@universe/chains'
import { createContext, type ReactNode, useMemo, useState, useSyncExternalStore } from 'react'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionDisplayModel } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'
import { resolveTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import {
  type InitialAuctionLoading,
  resolveInitialAuctionLoading,
} from '~/pages/TokenDetails/utils/tokenDetailsAuctionLoading'

export const TokenDetailsAuctionDisplayContext = createContext<TokenDetailsAuctionDisplayModel | null>(null)

const subscribeToOnlineStatus = (onChange: () => void): (() => void) => onlineManager.subscribe(onChange)
const getOnlineStatus = (): boolean => onlineManager.isOnline()

export function TokenDetailsAuctionDisplayProvider({ children }: { children: ReactNode }): JSX.Element {
  const { auctionSource, currencyChainId, address, currency, pageQueryLoading } = useTDPStore((state) => ({
    auctionSource: state.auctionSource,
    currencyChainId: state.currencyChainId,
    address: state.address,
    currency: state.currency,
    pageQueryLoading: state.pageQueryLoading,
  }))
  const pageKey = `${currencyChainId}:${normalizeTokenAddressForCache(address)}`
  const isPageReady = !pageQueryLoading && Boolean(currency)
  const chainId = isEVMChain(currencyChainId) ? currencyChainId : undefined
  const auction =
    auctionSource.status === TokenDetailsSourceState.Found && chainId !== undefined ? auctionSource.auction : undefined
  // Every sibling's phase resolves against this one head, so it has to keep advancing until the last
  // auction on the token ends. Frozen at the primary's end block, a sibling that has actually ended
  // stays Live and drops out of the token-level raise, which then renders as a complete total.
  const auctions = useTokenDetailsAuctions()
  const watchUntilBlock = useMemo(
    () =>
      auctions.reduce<bigint | undefined>((latest, entry) => {
        const endBlock = parseNonNegativeBigInt(entry.endBlock)
        return endBlock !== null && (latest === undefined || endBlock > latest) ? endBlock : latest
      }, undefined),
    [auctions],
  )
  // Not the only observer: the claim allocation hook mounts its own instance that keeps polling to the claim block.
  const { currentBlock, currencyRaised, pools, refetchCurrentBlock } = useAuctionDisplayDataSources({
    chainId,
    tokenAddress: auction?.tokenAddress,
    auctionAddress: auction?.address,
    startBlock: auction?.startBlock,
    endBlock: auction?.endBlock,
    watchUntilBlock,
    enabled: auction !== undefined,
  })
  const display = useMemo(
    () => resolveTokenDetailsAuctionDisplay({ auction, chainId, currentBlock, currencyRaised, pools }),
    [auction, chainId, currentBlock, currencyRaised, pools],
  )
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, getOnlineStatus)
  const [initialLoading, setInitialLoading] = useState<InitialAuctionLoading>({ pageKey, pending: undefined })
  const nextInitialLoading = resolveInitialAuctionLoading({
    previous: initialLoading,
    pageKey,
    isPageReady,
    isOnline,
    display,
  })
  if (nextInitialLoading !== initialLoading) {
    setInitialLoading(nextInitialLoading)
  }

  const isInitialLoading = nextInitialLoading.pending === true && isOnline
  const value = useMemo(
    () => ({ ...display, refetchCurrentBlock, isInitialLoading }),
    [display, refetchCurrentBlock, isInitialLoading],
  )

  return (
    <TokenDetailsAuctionDisplayContext.Provider value={value}>{children}</TokenDetailsAuctionDisplayContext.Provider>
  )
}
