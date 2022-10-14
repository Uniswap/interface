import graphql from 'babel-plugin-relay/macro'
import { loadQuery, useLazyLoadQuery, usePreloadedQuery } from 'react-relay'

import NFTRelayEnvironment from './NFTRelayEnvironment'

const assetsQuery = graphql`
  query MyQuery {
    nftAssets(
      address: "0x60e4d786628fea6478f785a6d7e704777c86a7c6"
      orderBy: PRICE
      asc: true
      filter: { buyNow: true }
      pagination: { first: 25 }
    ) {
      edges {
        node {
          id
          name
          ownerAddress
          image {
            url
          }
          smallImage {
            url
          }
          tokenId
          description
          animationUrl
          collection {
            isVerified
            image {
              url
            }
          }
          listings(pagination: { first: 1 }) {
            edges {
              node {
                address
                createdAt
                endAt
                id
                maker
                marketplace
                marketplaceUrl
                orderHash
                price {
                  currency
                  value
                }
                quantity
                startAt
                status
                taker
                tokenId
                type
              }
              cursor
            }
          }
          rarities {
            provider
            rank
            score
          }
          nftContract {
            address
            chain
            id
          }
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

export function useAssetsQuery() {
  const resp = useLazyLoadQuery(assetsQuery, {})
  console.log(resp)
}

const assetsQueryReference = loadQuery(NFTRelayEnvironment, assetsQuery, {})

export function useAssetsPreloadedQuery() {
  const resp = usePreloadedQuery(assetsQuery, assetsQueryReference)
  console.log(resp)
}
