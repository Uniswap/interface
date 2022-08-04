import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { Loading } from 'src/components/loading'
import { TokenDetailsStatsQuery } from 'src/components/TokenDetails/__generated__/TokenDetailsStatsQuery.graphql'
import { toGraphQLChain } from 'src/utils/chainId'

const tokenDetailsStatsQuery = graphql`
  query TokenDetailsStatsQuery($contract: ContractInput) {
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
`

function TokenDetailsStatsInner({ currency }: { currency: Currency }) {
  const data = useLazyLoadQuery<TokenDetailsStatsQuery>(tokenDetailsStatsQuery, {
    contract: {
      address: currency.wrapped.address,
      chain: toGraphQLChain(currency.chainId) ?? 'ETHEREUM',
    },
  })
  data // to prevent lint error, UI PR is coming

  return null
}

export function TokenDetailsStats({ currency }: { currency: Currency }) {
  return (
    <Suspense fallback={<Loading />}>
      <TokenDetailsStatsInner currency={currency} />
    </Suspense>
  )
}
