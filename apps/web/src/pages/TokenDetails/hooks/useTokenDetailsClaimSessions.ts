import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, type EVMUniverseChainId, isEVMChain, normalizeAddress, Platform } from '@universe/chains'
import { useMemo } from 'react'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsCustomAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCustomAuctions'

export interface TokenDetailsClaimSession {
  /** Chain, auction, and wallet; the owner keys its transaction state on it and outlets match against it. */
  sessionKey: string
  chainId: EVMUniverseChainId
  auction: PlainMessage<Auction>
  walletAddress: string
}

/**
 * The connected wallet's claim session for each known Custom auction on the page, in backend order. The
 * allocation hook, the transaction owners, and every card outlet derive eligibility from this one place.
 */
export function useTokenDetailsClaimSessions(): TokenDetailsClaimSession[] {
  const chainId = useTDPStore((s) => s.currencyChainId)
  const walletAddress = useActiveAddress(Platform.EVM)
  const auctions = useTokenDetailsCustomAuctions()
  return useMemo(() => {
    if (!walletAddress || !isEVMChain(chainId)) {
      return []
    }
    const wallet = normalizeAddress(walletAddress, AddressStringFormat.Lowercase)
    return auctions.map((auction) => ({
      sessionKey: `${chainId}:${normalizeAddress(auction.address, AddressStringFormat.Lowercase)}:${wallet}`,
      chainId,
      auction,
      walletAddress,
    }))
  }, [auctions, chainId, walletAddress])
}
