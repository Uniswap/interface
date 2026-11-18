import { PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { AuctionWithStats } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { EVMUniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
// oxlint-disable-next-line no-restricted-imports -- Direct selector access needed for auction testnet filtering
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isHiddenAuction } from 'uniswap/src/features/toucan/hiddenAuctions'
import { useVerifiedAuctionIds } from 'uniswap/src/features/toucan/useVerifiedAuctionIds'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useMultiChainBlockInfo } from '~/features/Toucan/hooks/useTopAuctions/useMultiChainBlockInfo'
import {
  type AuctionTimeRemaining,
  getAuctionTimeRemaining,
} from '~/features/Toucan/hooks/useTopAuctions/utils/getAuctionTimeRemaining'

export type EnrichedAuction = PlainMessage<AuctionWithStats> & {
  verified: boolean
  logoUrl: Maybe<string>
  timeRemaining: AuctionTimeRemaining
}

type Auction = NonNullable<PlainMessage<AuctionWithStats>['auction']>
type CurrencyInfo = ReturnType<typeof useCurrencyInfos>[number]

function getAuctionCurrencyId(auction: Auction | undefined): string | undefined {
  return auction ? buildCurrencyId(auction.chainId, auction.tokenAddress) : undefined
}

function getAuctionWithCurrencyInfo({
  auction,
  currencyInfo,
}: {
  auction: Auction | undefined
  currencyInfo: CurrencyInfo | undefined
}): PlainMessage<AuctionWithStats>['auction'] {
  if (auction === undefined) {
    return undefined
  }

  return {
    ...toPlainMessage(auction),
    tokenName: currencyInfo?.currency.name ?? auction.tokenName,
    tokenSymbol: currencyInfo?.currency.symbol ?? auction.tokenSymbol,
  }
}

export function useEnrichedAuctions(auctions: PlainMessage<AuctionWithStats>[]): {
  auctions: EnrichedAuction[]
  areBlocksSettled: boolean
} {
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)
  const verifiedAuctionIds = useVerifiedAuctionIds()

  const currencyIds = useMemo(
    () =>
      auctions.map((auction) => getAuctionCurrencyId(auction.auction)).filter((id): id is string => id !== undefined),
    [auctions],
  )
  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: auctions.length === 0,
  })

  // Build a lookup map from currencyId → currencyInfo to avoid index misalignment
  // (currencyIds filters out null-auction entries, so its indices don't match `auctions`)
  const currencyInfoByCurrencyId = useMemo(() => {
    const map = new Map<string, (typeof currencyInfos)[number]>()
    currencyIds.forEach((id, i) => {
      if (currencyInfos[i]) {
        map.set(id, currencyInfos[i])
      }
    })
    return map
  }, [currencyIds, currencyInfos])

  const auctionChainIds = useMemo(() => {
    return new Set(auctions.map((a) => a.auction?.chainId).filter((id): id is EVMUniverseChainId => id !== undefined))
  }, [auctions])

  const { blocksByChain, pendingChainIds } = useMultiChainBlockInfo(auctionChainIds)

  const enrichedAuctions = useMemo<EnrichedAuction[]>(() => {
    if (auctions.length === 0) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)
    const currentTimeMs = Date.now()

    return auctions
      .map((auctionWithStats) => {
        const coreAuction = auctionWithStats.auction
        const currencyId = getAuctionCurrencyId(coreAuction)
        const currencyInfo = currencyId ? currencyInfoByCurrencyId.get(currencyId) : undefined

        const timeRemaining = getAuctionTimeRemaining({
          auction: coreAuction,
          liveBlock: coreAuction ? blocksByChain.get(coreAuction.chainId) : undefined,
          currentTimeMs,
        })
        const auctionWithCurrency = getAuctionWithCurrencyInfo({ auction: coreAuction, currencyInfo })

        return {
          ...auctionWithStats,
          verified: coreAuction ? verifiedSet.has(coreAuction.auctionId) : false,
          // Image precedence (mirrors the auction detail page): API image (creator upload or
          // backend override) -> indexed currency logo -> TokenLogo placeholder. Centralized here
          // so the table cell and chip stay consistent. `||` (not `??`) so an empty-string API
          // image is treated as absent and doesn't suppress the indexed logo, independent of the
          // backend's unset-vs-"".
          logoUrl: coreAuction?.tokenImageUrl || currencyInfo?.logoUrl,
          timeRemaining,
          auction: auctionWithCurrency,
        }
      })
      .filter((auctionWithInfo) => {
        if (isHiddenAuction({ auctionId: auctionWithInfo.auction?.auctionId })) {
          return false
        }
        const chainId = auctionWithInfo.auction?.chainId
        return (
          chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId)) && !pendingChainIds.has(chainId)
        )
      })
  }, [auctions, verifiedAuctionIds, isTestnetModeEnabled, currencyInfoByCurrencyId, blocksByChain, pendingChainIds])

  return { auctions: enrichedAuctions, areBlocksSettled: pendingChainIds.size === 0 }
}
