import { toPlainMessage } from '@bufbuild/protobuf'
import { dehydrate, QueryClient } from '@tanstack/react-query'
import { GetBidsByWalletRequest, GetBidsByWalletResponse } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { sharedDehydrateOptions } from 'uniswap/src/data/reactQuery/sharedDehydrateOptions'

const walletAddress = '0x1111111111111111111111111111111111111111'
const request = new GetBidsByWalletRequest({
  walletId: walletAddress,
  auctionAddress: '0x2222222222222222222222222222222222222222',
  chainId: UniverseChainId.Mainnet,
})
const response = toPlainMessage(
  new GetBidsByWalletResponse({ bids: [{ bidId: '1', walletId: walletAddress, amount: '750' }] }),
)

afterEach(() => {
  SharedQueryClient.clear()
})

it('excludes the actual shared wallet-bids query from dehydration', () => {
  const client = new QueryClient()
  const options = auctionQueries.getBidsByWallet({ params: request })
  client.setQueryDefaults(options.queryKey, options)
  client.setQueryData(options.queryKey, response)

  expect(client.getQueryData(options.queryKey)).toEqual(response)
  expect(dehydrate(client, sharedDehydrateOptions).queries).toEqual([])
  client.clear()
})
