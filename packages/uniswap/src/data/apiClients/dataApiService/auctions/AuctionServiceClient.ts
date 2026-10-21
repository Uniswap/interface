import { createPromiseClient } from '@connectrpc/connect'
import { AuctionService } from '@uniswap/client-launches/dist/data/v1/auction_connect'
import { createAuctionServiceClient } from '@universe/api'
import { auctionsTransport } from 'uniswap/src/data/apiClients/dataApiService/auctions/base'

export const AuctionServiceClient = createAuctionServiceClient({
  rpcClient: createPromiseClient(AuctionService, auctionsTransport),
})
