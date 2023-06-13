/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'
import gql from 'graphql-tag'

export type Maybe<T> = T
export type InputMaybe<T> = T
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }

const THE_GRAPH_SCHEMA_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'

export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  AWSJSON: any
}

export enum NftAssetSortableField {
  Price = 'PRICE',
  Rarity = 'RARITY',
}

export enum NftMarketplace {
  Cryptopunks = 'CRYPTOPUNKS',
  Foundation = 'FOUNDATION',
  Looksrare = 'LOOKSRARE',
  Nft20 = 'NFT20',
  Nftx = 'NFTX',
  Opensea = 'OPENSEA',
  Sudoswap = 'SUDOSWAP',
  X2Y2 = 'X2Y2',
}

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  Valid = 'VALID',
}

export enum OrderType {
  Listing = 'LISTING',
  Offer = 'OFFER',
}

export type NftAssetTraitInput = {
  name: Scalars['String']
  values: Array<Scalars['String']>
}

export enum Currency {
  Eth = 'ETH',
  Matic = 'MATIC',
  Usd = 'USD',
}

export enum NftStandard {
  Erc721 = 'ERC721',
  Erc1155 = 'ERC1155',
  Noncompliant = 'NONCOMPLIANT',
}

export type NftAssetsFilterInput = {
  listed?: InputMaybe<Scalars['Boolean']>
  marketplaces?: InputMaybe<Array<NftMarketplace>>
  maxPrice?: InputMaybe<Scalars['String']>
  minPrice?: InputMaybe<Scalars['String']>
  tokenIds?: InputMaybe<Array<Scalars['String']>>
  tokenSearchQuery?: InputMaybe<Scalars['String']>
  traits?: InputMaybe<Array<NftAssetTraitInput>>
}

export type AssetQueryVariables = Exact<{
  address: Scalars['String']
  orderBy?: InputMaybe<NftAssetSortableField>
  asc?: InputMaybe<Scalars['Boolean']>
  filter?: InputMaybe<NftAssetsFilterInput>
  first?: InputMaybe<Scalars['Int']>
  after?: InputMaybe<Scalars['String']>
  last?: InputMaybe<Scalars['Int']>
  before?: InputMaybe<Scalars['String']>
}>

export type AssetQuery = {
  __typename?: 'Query'
  nftAssets?: {
    __typename?: 'NftAssetConnection'
    totalCount?: number
    edges: Array<{
      __typename?: 'NftAssetEdge'
      cursor: string
      node: {
        __typename?: 'NftAsset'
        id: string
        name?: string
        tokenId: string
        animationUrl?: string
        suspiciousFlag?: boolean
        image?: { __typename?: 'Image'; url: string }
        smallImage?: { __typename?: 'Image'; url: string }
        collection?: {
          __typename?: 'NftCollection'
          name?: string
          isVerified?: boolean
          nftContracts?: Array<{ __typename?: 'NftContract'; address: string; standard?: NftStandard }>
        }
        listings?: {
          __typename?: 'NftOrderConnection'
          edges: Array<{
            __typename?: 'NftOrderEdge'
            cursor: string
            node: {
              __typename?: 'NftOrder'
              address: string
              createdAt: number
              endAt?: number
              id: string
              maker: string
              marketplace: NftMarketplace
              marketplaceUrl: string
              orderHash?: string
              quantity: number
              startAt: number
              status: OrderStatus
              taker?: string
              tokenId?: string
              type: OrderType
              protocolParameters?: any
              price: { __typename?: 'Amount'; currency?: Currency; value: number }
            }
          }>
        }
        rarities?: Array<{ __typename?: 'NftAssetRarity'; rank?: number }>
      }
    }>
    pageInfo: {
      __typename?: 'PageInfo'
      endCursor?: string
      hasNextPage?: boolean
      hasPreviousPage?: boolean
      startCursor?: string
    }
  }
}

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

type MetaTagInjectorInput = {
  id: any
  tokenId: any
  address: any
  name: any
  image: any
  collectionName: any
  rarity: any
}

class MetaTagInjector {
  private input: MetaTagInjectorInput

  constructor(input: MetaTagInjectorInput) {
    this.input = input
  }

  element(element) {
    element.append(`<meta property="og:title" content = "${this.input.name}"/>`, {
      html: true,
    })
    element.append(
      `<meta property="og:description" content = "Token #${this.input.id} from ${this.input.collectionName}. Rarity Rank #${this.input.rarity}"/>`,
      {
        html: true,
      }
    )
    element.append(`<meta property="og:image" content = "${this.input.image}"/>`, {
      html: true,
    })
    element.append('<meta property="og:type" content = "website"/>', {
      html: true,
    })
    element.append(`<meta property="og:image width" content = "1200"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image height" content = "600"/>`, {
      html: true,
    })
  }
}

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  console.log(request.url)
  const { index } = params
  const collectionAddress = String(index[0])
  const tokenId = index[1]
  try {
    const client = new ApolloClient({
      uri: THE_GRAPH_SCHEMA_ENDPOINT,
      cache: new InMemoryCache(),
    })
    const variables = {
      address: collectionAddress,
      orderBy: NftAssetSortableField.Price,
      asc: true,
      filter: {
        tokenIds: [tokenId],
      },
      first: 1,
    }
    console.log('Got here')
    const data = await client.query<AssetQuery>({
      query: AssetDocument,
      variables,
    })
    console.log(data)
    const asset = data?.nftAssets?.edges[0].node
    if (!asset) {
      return await next()
    }
    const formattedAsset = {
      id: asset.id,
      tokenId: asset.tokenId,
      address: collectionAddress,
      name: asset.name,
      image: asset.image?.url,
      collectionName: asset.collection?.name,
      rarity: asset.rarities?.[0]?.rank,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
