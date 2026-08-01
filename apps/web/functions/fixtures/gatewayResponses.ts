import { GraphQLApi } from '@universe/api'

/**
 * Canned GraphQL gateway responses for the cloud-function tests.
 *
 * Keyed by operation name + the identifying variables the worker sends
 * (chain + token address / pool address / pool id). The fixture server
 * (gatewayFixtureServer.ts) replays these so the meta-tag and OG-image tests
 * don't depend on live gateway latency. Values mirror real gateway data for
 * the assets the tests exercise; only the fields the worker consumes
 * (symbol, name, feeTier, protocolVersion, project.logoUrl) are included —
 * getToken/getPool read the raw network result, so omitted optional fields
 * are never observed. Logo URLs point at assets the dev server serves itself
 * to keep the tests off the network entirely.
 */

// Served by the Vite dev server from apps/web/public — satori (OG image
// rendering) and getRGBColor fetch this instead of an external logo CDN.
const LOCAL_LOGO_URL = 'http://localhost:3000/images/192x192_App_Icon.png'

interface TokenFixtureInput {
  id: string
  chain: GraphQLApi.Chain
  address?: string
  symbol: string
  name: string
}

function tokenResponse({ id, chain, address, symbol, name }: TokenFixtureInput): { data: GraphQLApi.TokenWebQuery } {
  return {
    data: {
      token: {
        __typename: 'Token',
        id,
        chain,
        address,
        symbol,
        name,
        standard: address ? GraphQLApi.TokenStandard.Erc20 : GraphQLApi.TokenStandard.Native,
        decimals: 18,
        project: {
          __typename: 'TokenProject',
          id: `${id}-project`,
          name,
          logoUrl: LOCAL_LOGO_URL,
          isSpam: false,
          tokens: [],
        },
      },
    },
  }
}

type PoolToken = { id: string; chain: GraphQLApi.Chain; address: string; symbol: string; name: string }

function poolToken({ id, chain, address, symbol, name }: PoolToken) {
  return {
    __typename: 'Token' as const,
    id,
    chain,
    address,
    symbol,
    name,
    standard: GraphQLApi.TokenStandard.Erc20,
    decimals: 18,
    project: {
      __typename: 'TokenProject' as const,
      id: `${id}-project`,
      name,
      logoUrl: LOCAL_LOGO_URL,
      isSpam: false,
    },
  }
}

interface PoolFixtureInput {
  id: string
  address: string
  feeTier: number
  token0: PoolToken
  token1: PoolToken
}

function v3PoolResponse({ id, address, feeTier, token0, token1 }: PoolFixtureInput): {
  data: GraphQLApi.V3PoolQuery
} {
  return {
    data: {
      v3Pool: {
        __typename: 'V3Pool',
        id,
        protocolVersion: GraphQLApi.ProtocolVersion.V3,
        address,
        feeTier,
        token0: poolToken(token0),
        token1: poolToken(token1),
        txCount: 1000,
      },
    },
  }
}

function v2PairResponse({ id, address, token0, token1 }: Omit<PoolFixtureInput, 'feeTier'>): {
  data: GraphQLApi.V2PairQuery
} {
  return {
    data: {
      v2Pair: {
        __typename: 'V2Pair',
        id,
        protocolVersion: GraphQLApi.ProtocolVersion.V2,
        address,
        token0: poolToken(token0),
        token1: poolToken(token1),
        txCount: 1000,
      },
    },
  }
}

const { Chain } = GraphQLApi

const WETH = (chain: GraphQLApi.Chain, id: string) => ({
  id,
  chain,
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  symbol: 'WETH',
  name: 'Wrapped Ether',
})

/**
 * Fixtures keyed by `${operationName}:${chain}:${lowercased address|poolId}`.
 * The native-token TokenWeb query sends no address variable, so its key has
 * an empty address segment. Requests without a matching key get a null root
 * field, which is exactly how the live gateway answers for unknown assets —
 * the "invalid token/pool" test cases rely on that.
 */
export const gatewayFixtureResponses: Record<string, { data: object }> = {
  // ── Token meta-tag + OG-image cases (token.test.ts, tokenImage.test.ts) ──
  'TokenWeb:ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': tokenResponse({
    id: 'fixture-token-usdc',
    chain: Chain.Ethereum,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    name: 'USDC',
  }),
  'TokenWeb:ETHEREUM:': tokenResponse({
    id: 'fixture-token-eth',
    chain: Chain.Ethereum,
    symbol: 'ETH',
    name: 'Ethereum',
  }),
  'TokenWeb:POLYGON:0x0000000000000000000000000000000000001010': tokenResponse({
    id: 'fixture-token-pol',
    chain: Chain.Polygon,
    address: '0x0000000000000000000000000000000000001010',
    symbol: 'POL',
    name: 'Polygon Ecosystem Token',
  }),
  'TokenWeb:ETHEREUM:0x6982508145454ce325ddbe47a25d4ec3d2311933': tokenResponse({
    id: 'fixture-token-pepe',
    chain: Chain.Ethereum,
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    symbol: 'PEPE',
    name: 'Pepe',
  }),

  // ── Pool meta-tag cases (pool.test.ts) ──
  'V3Pool:ETHEREUM:0xcbcdf9626bc03e24f779434178a73a0b4bad62ed': v3PoolResponse({
    id: 'fixture-pool-wbtc-weth',
    address: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
    feeTier: 3000,
    token0: {
      id: 'fixture-token-wbtc',
      chain: Chain.Ethereum,
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
    },
    token1: WETH(Chain.Ethereum, 'fixture-token-weth'),
  }),
  'V2Pair:ETHEREUM:0x517f9dd285e75b599234f7221227339478d0fcc8': v2PairResponse({
    id: 'fixture-pair-dai-mkr',
    address: '0x517f9dd285e75b599234f7221227339478d0fcc8',
    token0: {
      id: 'fixture-token-dai',
      chain: Chain.Ethereum,
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
    },
    token1: {
      id: 'fixture-token-mkr',
      chain: Chain.Ethereum,
      address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      symbol: 'MKR',
      name: 'Maker',
    },
  }),
  'V3Pool:OPTIMISM:0xd1f1bad4c9e6c44dec1e9bf3b94902205c5cd6c3': v3PoolResponse({
    id: 'fixture-pool-usdce-wld',
    address: '0xd1f1bad4c9e6c44dec1e9bf3b94902205c5cd6c3',
    feeTier: 10000,
    token0: {
      id: 'fixture-token-usdce',
      chain: Chain.Optimism,
      address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      symbol: 'USDC.e',
      name: 'Bridged USDC',
    },
    token1: {
      id: 'fixture-token-wld',
      chain: Chain.Optimism,
      address: '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1',
      symbol: 'WLD',
      name: 'Worldcoin',
    },
  }),

  // ── Pool OG-image cases (poolImage.test.ts) — only status + content-type
  // are asserted, so representative token data is sufficient. ──
  'V3Pool:ETHEREUM:0xa43fe16908251ee70ef74718545e4fe6c5ccec9f': v3PoolResponse({
    id: 'fixture-pool-pepe-weth',
    address: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f',
    feeTier: 3000,
    token0: {
      id: 'fixture-token-pepe',
      chain: Chain.Ethereum,
      address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
      symbol: 'PEPE',
      name: 'Pepe',
    },
    token1: WETH(Chain.Ethereum, 'fixture-token-weth'),
  }),
  'V3Pool:BASE:0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa': v3PoolResponse({
    id: 'fixture-pool-weth-usdc-base',
    address: '0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa',
    feeTier: 500,
    token0: WETH(Chain.Base, 'fixture-token-weth-base'),
    token1: {
      id: 'fixture-token-usdc-base',
      chain: Chain.Base,
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USDC',
    },
  }),
}
