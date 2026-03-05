/* eslint-disable import/no-unused-modules -- exports used in upstack PR */
import { useState } from 'react'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'

export {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/store/useCreateAuctionStore'

export function CreateAuctionContextProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createCreateAuctionStore())

  return <CreateAuctionStoreContext.Provider value={store}>{children}</CreateAuctionStoreContext.Provider>
}
