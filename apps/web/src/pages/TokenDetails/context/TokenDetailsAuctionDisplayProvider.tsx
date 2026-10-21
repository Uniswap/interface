import { onlineManager } from '@tanstack/react-query'
import { isEVMChain, normalizeTokenAddressForCache } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { createContext, type ReactNode, useMemo, useState, useSyncExternalStore } from 'react'
import { isAuctionLaunchMethod, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { useTokenLaunchProvenance } from 'uniswap/src/features/dataApi/useTokenLaunchProvenance'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionDisplayModel } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'
import { resolveTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import {
  type AuctionPoolConfirmation,
  isAuctionOnlyStillResolving,
  type InitialAuctionLoading,
  resolveAuctionPoolConfirmation,
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
  // Shares the page's own GetToken read, so the attribution lands with the token rather than behind
  // the auction lookup the rest of this display state waits on. Gated with that lookup: served
  // attribution alone renders the provenance module, which the flag still owns.
  const tokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const servedProvenance = useTokenLaunchProvenance(
    tokenProvenanceEnabled && currency ? currencyId(currency) : undefined,
  )
  // Not the only observer: the claim allocation hook mounts its own instance that keeps polling to the claim block.
  const { currentBlock, currencyRaised, pools, refetchCurrentBlock } = useAuctionDisplayDataSources({
    chainId,
    // The auction's token is this page's token, and `ListPools` is keyed on the checksummed address
    // either way, so reading it off the page keeps one pool request across the auction landing.
    tokenAddress: address,
    auctionAddress: auction?.address,
    startBlock: auction?.startBlock,
    endBlock: auction?.endBlock,
    watchUntilBlock,
    enabled: auction !== undefined,
    // GetToken already says the token launched by auction, so the pool read runs alongside the
    // auction lookup rather than after it — one round trip off the banner and swap decisions.
    poolLookupEnabled: isAuctionLaunchMethod(servedProvenance?.method),
  })
  const display = useMemo(
    () =>
      resolveTokenDetailsAuctionDisplay({ auction, chainId, currentBlock, currencyRaised, pools, servedProvenance }),
    [auction, chainId, currentBlock, currencyRaised, pools, servedProvenance],
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
  // `isInitialLoading` latches false once content has been shown, and it never opens at all when the
  // page query wins the race against the auction lookup. A surface that would otherwise commit to a
  // non-auction rendering has to track the question itself, across both the lookup and what it feeds.
  const isAuctionOnlyPending =
    isOnline &&
    isPageReady &&
    (auctionSource.status === TokenDetailsSourceState.Loading ||
      (display.launchMethod === LaunchProvenanceMethod.CustomAuction && isAuctionOnlyStillResolving(display)))

  const poolKey = `${pageKey}:${auction?.address ?? ''}`
  const [poolConfirmation, setPoolConfirmation] = useState<AuctionPoolConfirmation>({ key: poolKey, confirmed: false })
  const nextPoolConfirmation = resolveAuctionPoolConfirmation({
    previous: poolConfirmation,
    key: poolKey,
    hasPool: display.poolAvailability === PoolAvailability.HasPool,
  })
  if (nextPoolConfirmation !== poolConfirmation) {
    setPoolConfirmation(nextPoolConfirmation)
  }

  const value = useMemo(
    () => ({
      ...display,
      refetchCurrentBlock,
      isInitialLoading,
      isAuctionOnlyPending,
      hasConfirmedPool: nextPoolConfirmation.confirmed,
    }),
    [display, refetchCurrentBlock, isInitialLoading, isAuctionOnlyPending, nextPoolConfirmation.confirmed],
  )

  return (
    <TokenDetailsAuctionDisplayContext.Provider value={value}>{children}</TokenDetailsAuctionDisplayContext.Provider>
  )
}
