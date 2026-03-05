import { createContext } from 'react'
import { AuctionStore } from '~/components/Toucan/Auction/store/createAuctionStore'

export const AuctionStoreContext = createContext<AuctionStore | null>(null)
