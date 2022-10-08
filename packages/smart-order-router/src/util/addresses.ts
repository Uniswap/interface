import { Token } from '@uniswap/sdk-core';
import { FACTORY_ADDRESS } from '@uniswap/v3-sdk';

import { ChainId, NETWORKS_WITH_SAME_UNISWAP_ADDRESSES } from './chains';

const CELO_V3_CORE_FACTORY_ADDRESSES =
  '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc';
const CELO_QUOTER_ADDRESSES = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';
const CELO_MULTICALL_ADDRESS = '0x633987602DE5C4F337e3DbF265303A1080324204';

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(FACTORY_ADDRESS),
  [ChainId.CELO]: CELO_V3_CORE_FACTORY_ADDRESSES,
  [ChainId.CELO_ALFAJORES]: CELO_V3_CORE_FACTORY_ADDRESSES,

  // TODO: Gnosis + Moonbeam contracts to be deployed
};

export const QUOTER_V2_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'),
  [ChainId.CELO]: CELO_QUOTER_ADDRESSES,
  [ChainId.CELO_ALFAJORES]: CELO_QUOTER_ADDRESSES,

  // TODO: Gnosis + Moonbeam contracts to be deployed
};

export const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap = {
  /// TODO: change this once we deploy
  [ChainId.MAINNET]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
  [ChainId.RINKEBY]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
  [ChainId.KOVAN]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
  [ChainId.ROPSTEN]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
  [ChainId.GÖRLI]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
};

export const UNISWAP_MULTICALL_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xb77C28244B48330FAFFC82382F502702F2B04048'),
  [ChainId.CELO]: CELO_MULTICALL_ADDRESS,
  [ChainId.CELO_ALFAJORES]: CELO_MULTICALL_ADDRESS,

  // TODO: Gnosis + Moonbeam contracts to be deployed
};

export const OVM_GASPRICE_ADDRESS =
  '0x420000000000000000000000000000000000000F';
export const ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C';

export const TICK_LENS_ADDRESS = '0xbfd8137f7d1516D3ea5cA83523914859ec47F573';
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS =
  '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
export const SWAP_ROUTER_ADDRESS = '0xBD86b34E6a136bfd4D417342Ca04c6e3F7Ab7614';
export const V3_MIGRATOR_ADDRESS = '0xA5644E29708357803b5A882D272c41cC0dF92B34';
export const MULTICALL2_ADDRESS = '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';

export type AddressMap = { [chainId: number]: string };

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: ChainId[] = []
): { [chainId: number]: T } {
  return NETWORKS_WITH_SAME_UNISWAP_ADDRESSES.concat(
    additionalNetworks
  ).reduce<{
    [chainId: number]: T;
  }>((memo, chainId) => {
    memo[chainId] = address;
    return memo;
  }, {});
}

export const WETH9: {
  [chainId in Exclude<
    ChainId,
    | ChainId.POLYGON
    | ChainId.POLYGON_MUMBAI
    | ChainId.CELO
    | ChainId.CELO_ALFAJORES
    | ChainId.GNOSIS
    | ChainId.MOONBEAM
  >]: Token;
} = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ROPSTEN]: new Token(
    ChainId.ROPSTEN,
    '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.RINKEBY]: new Token(
    ChainId.RINKEBY,
    '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.GÖRLI]: new Token(
    ChainId.GÖRLI,
    '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.KOVAN]: new Token(
    ChainId.KOVAN,
    '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISTIC_KOVAN]: new Token(
    ChainId.OPTIMISTIC_KOVAN,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISTIC_GOERLI]: new Token(
    ChainId.OPTIMISTIC_GOERLI,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ARBITRUM_ONE]: new Token(
    ChainId.ARBITRUM_ONE,
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ARBITRUM_RINKEBY]: new Token(
    ChainId.ARBITRUM_RINKEBY,
    '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681',
    18,
    'WETH',
    'Wrapped Ether'
  ),
};
