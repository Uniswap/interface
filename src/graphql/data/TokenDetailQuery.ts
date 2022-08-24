import graphql from 'babel-plugin-relay/macro'
import { SupportedChainId } from 'constants/chains'
import { useLazyLoadQuery } from 'react-relay'

import type { Chain, TokenDetailQuery as TokenDetailQueryType } from './__generated__/TokenDetailQuery.graphql'

export function chainIdToChainName(networkId: SupportedChainId): Chain {
  switch (networkId) {
    case SupportedChainId.MAINNET:
      return 'ETHEREUM'
    case SupportedChainId.ARBITRUM_ONE:
      return 'ARBITRUM'
    case SupportedChainId.OPTIMISM:
      return 'OPTIMISM'
    case SupportedChainId.POLYGON:
      return 'POLYGON'
    default:
      return 'ETHEREUM'
  }
}

export function useTokenDetailQuery(address: string, chain: Chain) {
  const tokenDetail = useLazyLoadQuery<TokenDetailQueryType>(
    graphql`
      query TokenDetailQuery($contract: ContractInput!) {
        tokenProjects(contracts: [$contract]) {
          description
          homepageUrl
          twitterName
          name
          markets(currencies: [USD]) {
            price {
              value
              currency
            }
            marketCap {
              value
              currency
            }
            fullyDilutedMarketCap {
              value
              currency
            }
            volume24h: volume(duration: DAY) {
              value
              currency
            }
            priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
              value
              currency
            }
            priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
              value
              currency
            }
          }
          tokens {
            chain
            address
            symbol
            decimals
          }
        }
      }
    `,
    {
      contract: {
        address,
        chain,
      },
    }
  )
  const { description, homepageUrl, twitterName, name, markets, tokens } = tokenDetail?.tokenProjects?.[0] ?? {}
  const { price, marketCap, fullyDilutedMarketCap, volume24h, priceHigh52W, priceLow52W } = markets?.[0] ?? {}
  return {
    description,
    homepageUrl,
    twitterName,
    name,
    markets,
    tokens,
    price,
    marketCap,
    fullyDilutedMarketCap,
    volume24h,
    priceHigh52W,
    priceLow52W,
  }
}
