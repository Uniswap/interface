import { gql } from '@apollo/client'

import {
  Currency,
  NftMarketplace,
  NftStandard,
  OrderStatus,
  OrderType,
} from '../../src/graphql/data/__generated__/types-and-hooks'

export const AssetDocument = gql`
  query Asset(
    $address: String!
    $orderBy: NftAssetSortableField
    $asc: Boolean
    $filter: NftAssetsFilterInput
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    nftAssets(
      address: $address
      orderBy: $orderBy
      asc: $asc
      filter: $filter
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        node {
          id
          name
          image {
            url
          }
          smallImage {
            url
          }
          tokenId
          animationUrl
          suspiciousFlag
          collection {
            name
            isVerified
            description
            nftContracts {
              address
              standard
            }
          }
          listings(first: 1) {
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
                protocolParameters
              }
              cursor
            }
          }
          rarities {
            rank
          }
        }
        cursor
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

export type AssetQuery = {
  readonly __typename?: 'Query'
  readonly nftAssets?: {
    readonly __typename?: 'NftAssetConnection'
    readonly totalCount?: number
    readonly edges: ReadonlyArray<{
      readonly __typename?: 'NftAssetEdge'
      readonly cursor: string
      readonly node: {
        readonly __typename?: 'NftAsset'
        readonly id: string
        readonly name?: string
        readonly tokenId: string
        readonly animationUrl?: string
        readonly suspiciousFlag?: boolean
        readonly image?: { readonly __typename?: 'Image'; readonly url: string }
        readonly smallImage?: { readonly __typename?: 'Image'; readonly url: string }
        readonly collection?: {
          readonly __typename?: 'NftCollection'
          readonly name?: string
          readonly isVerified?: boolean
          readonly description?: string
          readonly nftContracts?: ReadonlyArray<{
            readonly __typename?: 'NftContract'
            readonly address: string
            readonly standard?: NftStandard
          }>
        }
        readonly listings?: {
          readonly __typename?: 'NftOrderConnection'
          readonly edges: ReadonlyArray<{
            readonly __typename?: 'NftOrderEdge'
            readonly cursor: string
            readonly node: {
              readonly __typename?: 'NftOrder'
              readonly address: string
              readonly createdAt: number
              readonly endAt?: number
              readonly id: string
              readonly maker: string
              readonly marketplace: NftMarketplace
              readonly marketplaceUrl: string
              readonly orderHash?: string
              readonly quantity: number
              readonly startAt: number
              readonly status: OrderStatus
              readonly taker?: string
              readonly tokenId?: string
              readonly type: OrderType
              readonly protocolParameters?: any
              readonly price: { readonly __typename?: 'Amount'; readonly currency?: Currency; readonly value: number }
            }
          }>
        }
        readonly rarities?: ReadonlyArray<{ readonly __typename?: 'NftAssetRarity'; readonly rank?: number }>
      }
    }>
    readonly pageInfo: {
      readonly __typename?: 'PageInfo'
      readonly endCursor?: string
      readonly hasNextPage?: boolean
      readonly hasPreviousPage?: boolean
      readonly startCursor?: string
    }
  }
}
