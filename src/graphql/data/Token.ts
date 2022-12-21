import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import gql from 'graphql-tag'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { TokenQuery } from './__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID } from './util'

/*
The difference between Token and TokenProject:
  Token: an on-chain entity referring to a contract (e.g. uni token on ethereum 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984)
  TokenProject: an off-chain, aggregated entity that consists of a token and its bridged tokens (e.g. uni token on all chains)
  TokenMarket and TokenProjectMarket then are market data entities for the above.
    TokenMarket is per-chain market data for contracts pulled from the graph.
    TokenProjectMarket is aggregated market data (aggregated over multiple dexes and centralized exchanges) that we get from coingecko.
*/
gql`
  query Token($contract: ContractInput!) {
    tokens(contracts: [$contract]) {
      id
      decimals
      name
      chain
      address
      symbol
      market(currency: USD) {
        totalValueLocked {
          value
          currency
        }
        price {
          value
          currency
        }
        volume24H: volume(duration: DAY) {
          value
          currency
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          value
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          value
        }
      }
      project {
        description
        homepageUrl
        twitterName
        logoUrl
        tokens {
          chain
          address
        }
      }
    }
  }
`

export type { Chain, TokenQuery } from './__generated__/types-and-hooks'

export type TokenQueryData = NonNullable<TokenQuery['tokens']>[number]

// TODO: Return a QueryToken from useTokenQuery instead of TokenQueryData to make it more usable in Currency-centric interfaces.
export class QueryToken extends WrappedTokenInfo {
  constructor(address: string, data: NonNullable<TokenQueryData>, logoSrc?: string) {
    super({
      chainId: CHAIN_NAME_TO_CHAIN_ID[data.chain],
      address,
      decimals: data.decimals ?? DEFAULT_ERC20_DECIMALS,
      symbol: data.symbol ?? '',
      name: data.name ?? '',
      logoURI: logoSrc ?? data.project?.logoUrl ?? undefined,
    })
  }
}
