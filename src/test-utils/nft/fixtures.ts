import {
  MediaType,
  NftActivityType,
  NftMarketplace,
  NftStandard,
  OrderStatus,
  OrderType,
} from 'graphql/data/__generated__/types-and-hooks'
import ms from 'ms.macro'
import { ActivityEvent, CollectionInfoForAsset, GenieAsset, Markets, Offer, SellOrder, WalletAsset } from 'nft/types'

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

export const TEST_VIDEO_NFT_ASSET: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHg0ZTFmNDE2MTNjOTA4NGZkYjllMzRlMTFmYWU5NDEyNDI3NDgwZTU2XzcyMDI=',
  address: '0x6c9369dc930fd794ad0af7511f483d936a2ef7f3',
  notForSale: false,
  collectionName: 'Terraforms by Mathcastles',
  imageUrl:
    'https://i.seadn.io/gae/tkDbNhjjBZV2PmYaJbJOOigywZCrlcyGRxeQFkZS1YZyihyG5GoWNWj3N9f1T7YVuaxOqdxhfJylC9ejtoCvdgBE932vd7jorVqA?w=500&auto=format',
  animationUrl: 'https://openseauserdata.com/files/5af92728200027caa4f3f5ae87a486a7.mp4',
  mediaType: MediaType.Video,
  marketplace: Markets.Opensea,
  name: 'Aku Chapter IV: Aku x Ady #884',
  priceInfo: {
    ETHPrice: '1295000000000000000',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '1295000000000000000',
  },
  susFlag: false,
  tokenId: '1455',
  tokenType: NftStandard.Erc721,
  collectionIsVerified: false,
  totalCount: 9910,
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

export const TEST_AUDIO_NFT_ASSET: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHg0ZTFmNDE2MTNjOTA4NGZkYjllMzRlMTFmYWU5NDEyNDI3NDgwZTU2XzcyMDI=',
  address: '0x37a03d4af1d7046d1126987b20117a0fdcbf6535',
  notForSale: false,
  collectionName: 'Snoop Dogg on Sound XYZ',
  imageUrl:
    'https://i.seadn.io/gae/Kze9SBqn_6O0qrHKxspo1gRkkDV2A5EmTeWtvdS-dNxBsvi_wPXUYjc6De0sUC-DYzL093102mUftenWxwWuTelqsdw-ngoBC3o2XFU?w=500&auto=format',
  animationUrl: 'https://openseauserdata.com/files/4a22253e44e10baa11484a2e43efefda.mp3',
  mediaType: MediaType.Audio,
  marketplace: Markets.Opensea,
  name: 'Death Row Session: Vol. 2 (420 Edition) #320',
  priceInfo: {
    ETHPrice: '1295000000000000000',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '1295000000000000000',
  },
  susFlag: false,
  tokenId: '680564733841876926926749214863536423232',
  tokenType: NftStandard.Erc721,
  collectionIsVerified: false,
  totalCount: 9910,
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

export const TEST_EMBEDDED_NFT_ASSET: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHg0ZTFmNDE2MTNjOTA4NGZkYjllMzRlMTFmYWU5NDEyNDI3NDgwZTU2XzcyMDI=',
  address: '0x4e1f41613c9084fdb9e34e11fae9412427480e56',
  notForSale: false,
  collectionName: 'Terraforms by Mathcastles',
  imageUrl:
    'https://cdn.center.app/v2/1/06ff92279474add6ce06176e2a65447396edf786d169d8ccc03fddfa45ce004f/bb01f8a2f093ea4619498dae58fc19e5ba3fa38a84cabf92948994609489d566.png',
  animationUrl: 'https://tokens.mathcastles.xyz/terraforms/token-html/7202',
  mediaType: MediaType.Raw,
  marketplace: Markets.Opensea,
  name: 'Level 13 at {28, 3}',
  priceInfo: {
    ETHPrice: '1295000000000000000',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '1295000000000000000',
  },
  susFlag: false,
  tokenId: '7202',
  tokenType: NftStandard.Erc721,
  collectionIsVerified: false,
  totalCount: 9910,
  rarity: {
    primaryProvider: 'Rarity Sniper',
    providers: [
      {
        rank: 7079,
        provider: 'Rarity Sniper',
      },
    ],
  },
  creator: { address: '0xe72eb31b59f85b19499a0f3b3260011894fa0d65' },
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

export const TEST_NFT_COLLECTION_INFO_FOR_ASSET: CollectionInfoForAsset = {
  collectionDescription:
    'Take the red bean to join the garden. View the collection at [azuki.com/gallery](https://azuki.com/gallery).\r\n\r\nAzuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet to create a decentralized future. Azuki holders receive access to exclusive drops, experiences, and more. Visit [azuki.com](https://azuki.com) for more details.\r\n\r\nWe rise together. We build together. We grow together.',
  collectionImageUrl:
    'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
  collectionName: 'Azuki',
  discordUrl: 'https://discord.gg/azuki',
  externalUrl: 'http://www.azuki.com',
  isVerified: true,
  totalSupply: 10000,
}

const FIVE_MONTHS_MILLISECONDS = ms`165 days`

export const TEST_SELL_ORDER: SellOrder = {
  address: '0x29d7ebca656665c1a52a92f830e413e394db6b4f',
  createdAt: 1683561510000,
  endAt: Date.now() + FIVE_MONTHS_MILLISECONDS,
  id: 'TmZ0T3JkZXI6MHgyOWQ3ZWJjYTY1NjY2NWMxYTUyYTkyZjgzMGU0MTNlMzk0ZGI2YjRmXzY4MTVfMHg3OWVhNDQ5YzMzNzVlZDFhOWQ3ZDk5ZjgwNjgyMDllYTc0OGM2ZDQyXzQ5NzAwMDAwMDAwMDAwMDAwMDAwMF9vcGVuc2VhX01vbiBNYXkgMDggMjAyMyAxNTo1ODozMCBHTVQrMDAwMCAoQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUp',
  maker: '0x79ea449c3375ed1a9d7d99f8068209ea748c6d42',
  marketplace: NftMarketplace.Opensea,
  marketplaceUrl: 'https://opensea.io/assets/0x29d7ebca656665c1a52a92f830e413e394db6b4f/6815',
  price: {
    currency: 'ETH',
    value: 99999999,
  },
  quantity: 1,
  startAt: 1683561507000,
  status: OrderStatus.Valid,
  type: OrderType.Listing,
  protocolParameters: {},
}

export const TEST_OFFER: Offer = {
  createdAt: 1683561510000,
  endAt: Date.now() + FIVE_MONTHS_MILLISECONDS,
  id: 'TmZ0T3JkZXI6MHgyOWQ3ZWJjYTY1NjY2NWMxYTUyYTkyZjgzMGU0MTNlMzk0ZGI2YjRmXzY4MTVfMHg3OWVhNDQ5YzMzNzVlZDFhOWQ3ZDk5ZjgwNjgyMDllYTc0OGM2ZDQyXzQ5NzAwMDAwMDAwMDAwMDAwMDAwMF9vcGVuc2VhX01vbiBNYXkgMDggMjAyMyAxNTo1ODozMCBHTVQrMDAwMCAoQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUp',
  maker: '0x79ea449c3375ed1a9d7d99f8068209ea748c6d42',
  marketplace: NftMarketplace.Opensea,
  marketplaceUrl: 'https://opensea.io/assets/0x29d7ebca656665c1a52a92f830e413e394db6b4f/6815',
  price: {
    currency: 'ETH',
    value: 123.456,
  },
  quantity: 1,
}
