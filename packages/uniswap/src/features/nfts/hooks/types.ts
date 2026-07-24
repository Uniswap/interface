import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'

export interface UseWalletNftsProps {
  address: Address
  filterSpam?: boolean
  skip?: boolean
  chainsFilter?: UniverseChainId[]
  pageSize?: number
  pollInterval?: PollingInterval
}

export interface UseWalletNftsResult {
  nfts: NFTItem[]
  loading: boolean
  hasNextPage: boolean
  isPending: boolean
  isFetchingMore: boolean
  isError: boolean
  fetchNextPage: () => Promise<void>
  refetch: () => void
}
