import { WETH9 } from '@uniswap/sdk-core'
import { DAI } from 'constants/tokens'
import {
  AssetActivityPartsFragment,
  Chain,
  SwapOrderStatus,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const MockOrderTimestamp = 10000

const mockAssetActivityPartsFragment = {
  __typename: 'AssetActivity',
  id: 'activityId',
  timestamp: MockOrderTimestamp,
  chain: Chain.Ethereum,
  details: {
    __typename: 'SwapOrderDetails',
    id: 'detailsId',
    offerer: 'offererId',
    hash: 'someHash',
    inputTokenQuantity: '100',
    outputTokenQuantity: '200',
    orderStatus: SwapOrderStatus.Open,
    inputToken: {
      __typename: 'Token',
      id: 'tokenId',
      chain: Chain.Ethereum,
      standard: TokenStandard.Erc20,
    },
    outputToken: {
      __typename: 'Token',
      id: 'tokenId',
      chain: Chain.Ethereum,
      standard: TokenStandard.Erc20,
    },
  },
}

const mockSwapOrderDetailsPartsFragment = {
  __typename: 'SwapOrderDetails',
  id: 'someId',
  offerer: 'someOfferer',
  hash: 'someHash',
  inputTokenQuantity: '100',
  outputTokenQuantity: '200',
  orderStatus: SwapOrderStatus.Open,
  inputToken: {
    __typename: 'Token',
    id: DAI.address,
    name: 'DAI',
    symbol: DAI.symbol,
    address: DAI.address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'imageId',
        url: 'someUrl',
      },
    },
  },
  outputToken: {
    __typename: 'Token',
    id: WETH9[1].address,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: WETH9[1].address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'imageId',
        url: 'someUrl',
      },
    },
  },
}

export const MockOpenUniswapXOrder = {
  ...mockAssetActivityPartsFragment,
  details: mockSwapOrderDetailsPartsFragment,
} as AssetActivityPartsFragment

export const MockExpiredUniswapXOrder = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...mockSwapOrderDetailsPartsFragment,
    orderStatus: SwapOrderStatus.Expired,
  },
} as AssetActivityPartsFragment

export const MockFilledUniswapXOrder = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...mockSwapOrderDetailsPartsFragment,
    orderStatus: SwapOrderStatus.Filled,
  },
} as AssetActivityPartsFragment
