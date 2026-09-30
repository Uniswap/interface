/**
 * Canned gateway responses for the cloud-function tests.
 *
 * `dataApiFixtureResponses` holds data-api v2 connect-RPC responses (getToken.ts's GetToken), keyed
 * by RPC name + chain id + token address. `liquidityFixtureResponses` holds liquidity v2 connect-RPC
 * responses (getPool.ts's GetPool), keyed by RPC name + chain id + identifier. The fixture server
 * (gatewayFixtureServer.ts) replays these so the meta-tag and OG-image tests don't depend on live
 * gateway latency. Values mirror real gateway data for the assets the tests exercise; only the
 * fields the worker consumes are included. Logo URLs point at assets the dev server serves itself
 * to keep the tests off the network entirely.
 */

// Served by the Vite dev server from apps/web/public — satori (OG image
// rendering) and getRGBColor fetch this instead of an external logo CDN.
const LOCAL_LOGO_URL = 'http://localhost:3000/images/192x192_App_Icon.png'

function getTokenResponse({
  chainId,
  address,
  symbol,
  name,
}: {
  chainId: number
  address: string
  symbol: string
  name: string
}): object {
  return {
    token: {
      chainId,
      address,
      symbol,
      name,
      decimals: 18,
      project: {
        name,
        logoUrl: LOCAL_LOGO_URL,
      },
    },
  }
}

/**
 * data-api v2 fixtures keyed by `GetToken:${chainId}:${lowercased address}`. The worker sends
 * natives under their REST address (the zero address for most EVM chains; Polygon's real POL
 * contract), so those keys carry that address. An unknown key gets an empty message — no `token`
 * field — which the "invalid token" test cases rely on.
 */
export const dataApiFixtureResponses: Record<string, object> = {
  // ── Token meta-tag + OG-image cases (token.test.ts, tokenImage.test.ts) ──
  'GetToken:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': getTokenResponse({
    chainId: 1,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    name: 'USDC',
  }),
  'GetToken:1:0x0000000000000000000000000000000000000000': getTokenResponse({
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
  }),
  'GetToken:137:0x0000000000000000000000000000000000001010': getTokenResponse({
    chainId: 137,
    address: '0x0000000000000000000000000000000000001010',
    symbol: 'POL',
    name: 'Polygon Ecosystem Token',
  }),
  'GetToken:1:0x6982508145454ce325ddbe47a25d4ec3d2311933': getTokenResponse({
    chainId: 1,
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    symbol: 'PEPE',
    name: 'Pepe',
  }),
}

const token = (symbol: string) => ({ symbol, logoUrl: LOCAL_LOGO_URL })

function getPoolResponse({
  poolIdentifier,
  protocolVersion,
  feeTier,
  token0Symbol,
  token1Symbol,
}: {
  poolIdentifier: string
  protocolVersion: 'V2' | 'V3' | 'V4'
  feeTier?: number
  token0Symbol: string
  token1Symbol: string
}): object {
  return {
    pool: {
      poolIdentifier,
      protocolVersion,
      isDynamicFee: false,
      ...(feeTier === undefined ? {} : { feeTier }),
      token0Metadata: token(token0Symbol),
      token1Metadata: token(token1Symbol),
    },
  }
}

function getPositionResponse({
  status = 'POSITION_STATUS_OPEN',
  feeTier,
  tickLower = -1000,
  tickUpper = 1000,
  currentTick = 0,
  token0Symbol,
  token1Symbol,
}: {
  status?: string
  feeTier?: number
  tickLower?: number
  tickUpper?: number
  currentTick?: number
  token0Symbol: string
  token1Symbol: string
}): object {
  return {
    position: {
      // The backend sends the full proto enum name for the status (POSITION_STATUS_OPEN).
      status,
      ...(feeTier === undefined ? {} : { feeTier }),
      tickLower,
      tickUpper,
      currentTick,
      token0Metadata: token(token0Symbol),
      token1Metadata: token(token1Symbol),
    },
  }
}

/**
 * liquidity v2 fixtures keyed by `GetPool:${chainId}:${lowercased addressOrId}` and
 * `GetPosition:${chainId}:${version}:${tokenId}` (chainId: ethereum = 1, optimism = 10, base = 8453;
 * version is the Protocols enum: V2 = 0, V3 = 1, V4 = 2). GetPool resolves the version from the
 * identifier, so there's one entry per pool. An unknown identifier gets an empty message, which the
 * invalid-pool/position test cases rely on.
 */
export const liquidityFixtureResponses: Record<string, object> = {
  // ── Pool meta-tag cases (pool.test.ts) ──
  // WBTC/WETH — ethereum V3, 0.30%
  'GetPool:1:0xcbcdf9626bc03e24f779434178a73a0b4bad62ed': getPoolResponse({
    poolIdentifier: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
    protocolVersion: 'V3',
    feeTier: 3000,
    token0Symbol: 'WBTC',
    token1Symbol: 'WETH',
  }),
  // DAI/MKR — ethereum V2 (fee defaults to 0.30%)
  'GetPool:1:0x517f9dd285e75b599234f7221227339478d0fcc8': getPoolResponse({
    poolIdentifier: '0x517f9dd285e75b599234f7221227339478d0fcc8',
    protocolVersion: 'V2',
    token0Symbol: 'DAI',
    token1Symbol: 'MKR',
  }),
  // USDC.e/WLD — optimism V3, 1%
  'GetPool:10:0xd1f1bad4c9e6c44dec1e9bf3b94902205c5cd6c3': getPoolResponse({
    poolIdentifier: '0xd1f1bad4c9e6c44dec1e9bf3b94902205c5cd6c3',
    protocolVersion: 'V3',
    feeTier: 10000,
    token0Symbol: 'USDC.e',
    token1Symbol: 'WLD',
  }),

  // ── Pool OG-image cases (poolImage.test.ts) — only status + content-type are asserted ──
  // PEPE/WETH — ethereum V3, 0.30%
  'GetPool:1:0xa43fe16908251ee70ef74718545e4fe6c5ccec9f': getPoolResponse({
    poolIdentifier: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f',
    protocolVersion: 'V3',
    feeTier: 3000,
    token0Symbol: 'PEPE',
    token1Symbol: 'WETH',
  }),
  // WETH/USDC — base V3, 0.05%
  'GetPool:8453:0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa': getPoolResponse({
    poolIdentifier: '0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa',
    protocolVersion: 'V3',
    feeTier: 500,
    token0Symbol: 'WETH',
    token1Symbol: 'USDC',
  }),

  // ── Position meta-tag + OG-image cases (position.test.ts, positionImage.test.ts). Synthetic token
  // ids (real position NFTs would resolve to different pairs against the live service). ──
  // WBTC/WETH — v3 (Protocols.V3 = 1) on ethereum, in range
  'GetPosition:1:1:40001': getPositionResponse({ feeTier: 3000, token0Symbol: 'WBTC', token1Symbol: 'WETH' }),
  // DAI/USDC — v4 (Protocols.V4 = 2) on ethereum, out of range (currentTick above upper)
  'GetPosition:1:2:40002': getPositionResponse({
    feeTier: 500,
    currentTick: 5000,
    token0Symbol: 'DAI',
    token1Symbol: 'USDC',
  }),
}
