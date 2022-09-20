import { ListingMarket, ListingRow } from 'nft/types'

interface Listing extends ListingRow {
  marketplaces: ListingMarket[]
}

export const logListing = async (listings: ListingRow[], userAddress: string): Promise<boolean> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/logGenieList`
  const listingsConsolidated: Listing[] = listings.map((el) => ({ ...el, marketplaces: [] }))
  const marketplacesById: Record<string, ListingMarket[]> = {}
  const listingsWithMarketsConsolidated = listingsConsolidated.reduce((uniqueListings, curr) => {
    const key = `${curr.asset.asset_contract.address}-${curr.asset.tokenId}`
    if (marketplacesById[key]) {
      marketplacesById[key].push(curr.marketplace)
    } else {
      marketplacesById[key] = [curr.marketplace]
    }
    if (!uniqueListings.some((listing) => `${listing.asset.asset_contract.address}-${listing.asset.tokenId}` === key)) {
      curr.marketplaces = marketplacesById[key]
      uniqueListings.push(curr)
    }
    return uniqueListings
  }, [] as Listing[])
  const payload = {
    listings: listingsWithMarketsConsolidated,
    userAddress,
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return r.status === 200
}
