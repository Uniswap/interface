import { createContext } from 'react'
import type { CreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'

export const CreateAuctionStoreContext = createContext<CreateAuctionStore | null>(null)
