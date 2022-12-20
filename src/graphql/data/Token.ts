import graphql from 'babel-plugin-relay/macro'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { TokenQuery$data } from './__generated__/TokenQuery.graphql'
import { CHAIN_NAME_TO_CHAIN_ID } from './util'

/*
The difference between Token and TokenProject:
  Token: an on-chain entity referring to a contract (e.g. uni token on ethereum 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984)
  TokenProject: an off-chain, aggregated entity that consists of a token and its bridged tokens (e.g. uni token on all chains)
  TokenMarket and TokenProjectMarket then are market data entities for the above.
    TokenMarket is per-chain market data for contracts pulled from the graph.
    TokenProjectMarket is aggregated market data (aggregated over multiple dexes and centralized exchanges) that we get from coingecko.
*/
export const tokenQuery = graphql`
  query TokenQuery($contract: ContractInput!) {
    tokens(contracts: [$contract]) {
      id @required(action: LOG)
      decimals
      name
      chain @required(action: LOG)
      address @required(action: LOG)
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
          chain @required(action: LOG)
          address @required(action: LOG)
        }
      }
    }
  }
`
export type { Chain, TokenQuery } from './__generated__/TokenQuery.graphql'

export type TokenQueryData = NonNullable<TokenQuery$data['tokens']>[number]

// TODO: Return a QueryToken from useTokenQuery instead of TokenQueryData to make it more usable in Currency-centric interfaces.
export class QueryToken extends WrappedTokenInfo {
  constructor(data: NonNullable<TokenQueryData>, logoSrc?: string) {
    super({
      chainId: CHAIN_NAME_TO_CHAIN_ID[data.chain],
      address: data.address,
      decimals: data.decimals ?? DEFAULT_ERC20_DECIMALS,
      symbol: data.symbol ?? '',
      name: data.name ?? '',
      logoURI: logoSrc ?? data.project?.logoUrl ?? undefined,
    })
  }
}
