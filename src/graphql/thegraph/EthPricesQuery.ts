import graphql from 'babel-plugin-relay/macro'

export type { EthPricesQuery$data, EthPricesQuery as TopTokenQueryType } from './__generated__/EthPricesQuery.graphql'

export const query = graphql`
  query EthPricesQuery($block24: Int!, $block48: Int!, $blockWeek: Int!) {
    current: bundles(first: 1, subgraphError: allow) {
      ethPriceUSD
    }
    oneDay: bundles(first: 1, block: { number: $block24 }, subgraphError: allow) {
      ethPriceUSD
    }
    twoDay: bundles(first: 1, block: { number: $block48 }, subgraphError: allow) {
      ethPriceUSD
    }
    oneWeek: bundles(first: 1, block: { number: $blockWeek }, subgraphError: allow) {
      ethPriceUSD
    }
  }
`
