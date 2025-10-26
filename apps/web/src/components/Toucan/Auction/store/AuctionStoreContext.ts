import { AuctionStore } from 'components/Toucan/Auction/store/createAuctionStore'
import { createContext } from 'react'

export const AuctionStoreContext = createContext<AuctionStore | null>(null)
