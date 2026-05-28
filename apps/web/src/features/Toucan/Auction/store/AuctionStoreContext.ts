import { createContext } from 'react'
import { AuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'

export const AuctionStoreContext = createContext<AuctionStore | null>(null)
