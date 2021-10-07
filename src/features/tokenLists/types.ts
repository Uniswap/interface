import { TokenList } from '@uniswap/token-lists'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'

export interface TokenListState {
  current: TokenList | null
  pendingUpdate: TokenList | null
  loadingRequestId: string | null
  error: string | null
}

export interface TokenListsState {
  byUrl: {
    [url: string]: TokenListState
  }
  // this contains the default list of lists from the last time the updateVersion was called, i.e. the app was reloaded
  lastInitializedDefaultListOfLists?: string[]

  // currently active lists
  activeListUrls: string[] | undefined
}

export type TokenAddressMap = {
  [chainId: number]: {
    [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList }
  }
}

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
}

export interface SerializedPair {
  token0: SerializedToken
  token1: SerializedToken
}
