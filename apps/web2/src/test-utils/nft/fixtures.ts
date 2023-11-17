import { MediaType, NftActivityType, NftStandard, OrderStatus } from 'graphql/data/__generated__/types-and-hooks'
import { ActivityEvent, GenieAsset, Markets, WalletAsset } from 'nft/types'

export const TEST_NFT_ASSET: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHhlZDVhZjM4ODY1MzU2N2FmMmYzODhlNjIyNGRjN2M0YjMyNDFjNTQ0XzMzMTg=',
  address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
  notForSale: false,
  collectionName: 'Azuki',
  imageUrl:
    'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/3318/50ed67ad647d0aa0cad0b830d136a677efc2fb72a44587bc35f2a5fb334a7fdf.png',
  mediaType: MediaType.Image,
  marketplace: Markets.Opensea,
  name: 'Azuki #3318',
  priceInfo: {
    ETHPrice: '15800000000000000000',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '15800000000000000000',
  },
  susFlag: false,
  tokenId: '3318',
  tokenType: NftStandard.Erc721,
  totalCount: 10000,
  collectionIsVerified: true,
  rarity: {
    primaryProvider: 'Rarity Sniper',
    providers: [
      {
        rank: 7079,
        provider: 'Rarity Sniper',
      },
    ],
  },
  creator: {},
}

export const TEST_NFT_WALLET_ASSET: WalletAsset = {
  id: 'TmZ0QXNzZXQ6RVRIRVJFVU1fMHgyOTY1MkMyZTlEMzY1NjQzNEJjODEzM2M2OTI1OEM4ZDA1MjkwZjQxXzIzNTk=',
  imageUrl: 'https://c.neevacdn.net/image/upload/xyz/T96PksTnWGNh79CrzLn-zpYfqRWtD5wME0MBPL_Md6Q.png',
  smallImageUrl:
    'https://c.neevacdn.net/image/upload/c_limit,pg_1,h_1200,w_1200/f_webp/xyz/T96PksTnWGNh79CrzLn-zpYfqRWtD5wME0MBPL_Md6Q.webp',
  notForSale: true,
  priceInfo: {
    ETHPrice: '0',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '0',
  },
  name: 'Froggy Friend #2359',
  tokenId: '2359',
  asset_contract: {
    address: '0x29652c2e9d3656434bc8133c69258c8d05290f41',
    tokenType: NftStandard.Erc721,
    name: 'Froggy Friends Official',
    description: '4444 of the friendliest frogs in the metaverse.',
    image_url: 'https://i.seadn.io/gcs/files/84483786d97b4d471cb48d224c4c5c91.png?w=500&auto=format',
  },
  collection: {
    address: '0x29652c2e9d3656434bc8133c69258c8d05290f41',
    name: 'Froggy Friends Official',
    isVerified: true,
    imageUrl: 'https://i.seadn.io/gcs/files/84483786d97b4d471cb48d224c4c5c91.png?w=500&auto=format',
    twitterUrl: '@FroggyFriendNFT',
  },
  collectionIsVerified: true,
  lastPrice: 0,
  floorPrice: 0.0775,
  basisPoints: 0,
  date_acquired: '1682024661',
  sellOrders: [],
}

export const TEST_NFT_ACTIVITY_EVENT: ActivityEvent = {
  collectionAddress: '0xed5af388653567af2f388e6224dc7c4b3241c544',
  tokenId: '5674',
  tokenMetadata: {
    name: 'Azuki #5674',
    imageUrl:
      'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/5674/b2e5cb241d4a28bb3688ff6ae12f2d60c9850721f35f5104b5c42b31511e8a42.png',
    smallImageUrl: 'https://i.seadn.io/gcs/files/e2dabe8f353ed6354f5a1927e3d8bd64.png?w=500&auto=format',
    metadataUrl: 'ipfs://QmZcH4YvBVVRJtdn4RdbaqgspFU8gH6P9vomDpBVpAL3u4/5674',
    rarity: {
      source: 'RARITY_SNIPER',
      rank: 9412,
      score: 2778,
    },
    suspiciousFlag: false,
    standard: NftStandard.Erc721,
  },
  eventType: NftActivityType.Listing,
  marketplace: 'OPENSEA',
  fromAddress: '0xbf9fda32692b25c6083cbe48399ef019b62f0712',
  toAddress: undefined,
  transactionHash: undefined,
  price: '15.2',
  orderStatus: OrderStatus.Valid,
  quantity: 1,
  url: 'https://opensea.io/assets/0xed5af388653567af2f388e6224dc7c4b3241c544/5674',
  eventTimestamp: 1682444662,
}
