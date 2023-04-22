import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { V3Route } from '@uniswap/smart-order-router'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import JSBI from 'jsbi'
import { GenieAsset, Markets, WalletAsset } from 'nft/types'
import { InterfaceTrade } from 'state/routing/types'

export const TEST_TOKEN_1 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC', 'Abc')
export const TEST_TOKEN_2 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF', 'Def')
export const TEST_TOKEN_3 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 'GHI', 'Ghi')
export const TEST_RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000004'

export const TEST_POOL_12 = new Pool(
  TEST_TOKEN_1,
  TEST_TOKEN_2,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const TEST_POOL_13 = new Pool(
  TEST_TOKEN_1,
  TEST_TOKEN_3,
  FeeAmount.MEDIUM,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const toCurrencyAmount = (token: Token, amount: number) =>
  CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

export const TEST_TRADE_EXACT_INPUT = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([TEST_POOL_12], TEST_TOKEN_1, TEST_TOKEN_2),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
})

export const TEST_TRADE_EXACT_OUTPUT = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([TEST_POOL_13], TEST_TOKEN_1, TEST_TOKEN_3),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_OUTPUT,
})

export const TEST_ALLOWED_SLIPPAGE = new Percent(2, 100)

export const TEST_NFT_ASSET: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHhlZDVhZjM4ODY1MzU2N2FmMmYzODhlNjIyNGRjN2M0YjMyNDFjNTQ0XzMzMTg=',
  address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
  notForSale: false,
  collectionName: 'Azuki',
  imageUrl:
    'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/3318/50ed67ad647d0aa0cad0b830d136a677efc2fb72a44587bc35f2a5fb334a7fdf.png',
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
