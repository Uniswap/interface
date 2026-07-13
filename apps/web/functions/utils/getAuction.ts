import { PROD_ENTRY_GATEWAY_API_BASE_URL } from '@universe/api'
import { Data } from 'functions/utils/cache'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'
import { getAuctionMetadata } from '~/features/Toucan/Config/config'
import { formatAuctionMetatagTitleName } from '~/shared-cloud/metatags'

const GET_AUCTION_URL = PROD_ENTRY_GATEWAY_API_BASE_URL + '/data.v1.AuctionService/GetAuction'

interface AuctionApiResponse {
  auctions?: {
    tokenAddress: string
    tokenName?: string
    tokenSymbol: string
    currencyTokenSymbol?: string
  }[]
}

function toAbsoluteImageUrl(logoUrl: string | undefined, origin: string): string | undefined {
  if (!logoUrl) {
    return undefined
  }
  return logoUrl.startsWith('/') ? origin + logoUrl : logoUrl
}

export default async function getAuction({
  chainName,
  auctionAddress,
  url,
}: {
  chainName: string
  auctionAddress: string
  url: string
}): Promise<Data | undefined> {
  const origin = new URL(url).origin
  const image = origin + '/api/image/auctions/' + chainName + '/' + auctionAddress
  const chainId = URL_PARAM_TO_CHAIN_ID[chainName.toLowerCase()]
  if (!chainId) {
    return undefined
  }

  try {
    const response = await fetch(GET_AUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId,
        address: auctionAddress.toLowerCase(),
      }),
    })
    if (!response.ok) {
      return undefined
    }

    const result: AuctionApiResponse = await response.json()
    const auction = result.auctions?.[0]
    if (!auction) {
      return undefined
    }

    const metadata = getAuctionMetadata({ chainId, tokenAddress: auction.tokenAddress })
    const tokenSymbol = metadata?.tokenSymbol ?? auction.tokenSymbol
    const tokenName = metadata?.tokenName ?? auction.tokenName ?? tokenSymbol
    const tokenLogoUrl = toAbsoluteImageUrl(metadata?.logoUrl, origin)
    const title = formatAuctionMetatagTitleName(tokenSymbol, tokenName)

    return {
      title,
      image,
      url,
      description: `Bid on ${tokenName} in a Uniswap token auction.`,
      name: tokenName,
      auctionData: {
        tokenName,
        tokenSymbol,
        tokenLogoUrl,
        currencySymbol: auction.currencyTokenSymbol,
      },
    }
  } catch {
    return undefined
  }
}
