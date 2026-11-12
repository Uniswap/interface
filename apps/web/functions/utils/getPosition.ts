// The v2 `GetPositionRequest.version` field is generated as `uniswap.liquidity.v1.Protocols` (the v2
// proto reuses the v1 enum), so this v1 import is the matching request type — the same path the app
// imports Protocols from elsewhere (e.g. `getProtocols`, Migrate/buildParams).
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Data, PositionStatus } from 'functions/utils/cache'
import getPool from 'functions/utils/getPool'
import {
  formatLiquidityFeeTier,
  type LiquidityTokenMetadata,
  liquidityServicePost,
} from 'functions/utils/liquidityService'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { isToken0Quote, orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import type { ProtocolVersionLabel } from 'uniswap/src/features/positions/utils'

interface LiquidityPosition {
  feeTier?: number
  isDynamicFee?: boolean
  // Connect-JSON serializes the enum by its proto name (`POSITION_STATUS_OPEN`); `derivePositionStatus`
  // strips the prefix so a short-form value (e.g. a protobuf-es-serialized cache entry) also matches.
  status?: string
  tickLower?: number
  tickUpper?: number
  currentTick?: number
  token0Address?: string
  token0Metadata?: LiquidityTokenMetadata
  token1Metadata?: LiquidityTokenMetadata
  quoteTokenAddress?: string
}

/**
 * The liquidity service reports lifecycle (OPEN/CLOSED) rather than the OG image's finer
 * in-range/out-of-range, so derive the range from the position's ticks vs the pool's current tick.
 * Undefined (no badge) when the position is neither cleanly open nor closed, or when the ticks the
 * derivation needs are absent.
 */
function derivePositionStatus(position: LiquidityPosition): PositionStatus | undefined {
  const status = position.status?.replace(/^POSITION_STATUS_/, '')
  if (status === 'CLOSED') {
    return 'closed'
  }
  if (status !== 'OPEN') {
    return undefined
  }
  const { tickLower, tickUpper, currentTick } = position
  if (tickLower === undefined || tickUpper === undefined || currentTick === undefined) {
    return undefined
  }
  return currentTick >= tickLower && currentTick < tickUpper ? 'in_range' : 'out_of_range'
}

export default async function getPosition({
  version,
  chainName,
  identifier,
  url,
}: {
  version: ProtocolVersionLabel
  chainName: string
  identifier: string
  url: string
}): Promise<Data | undefined> {
  // V2 positions use the pair address, which is the pool address.
  if (version === 'v2') {
    return getPool({ networkName: chainName, poolAddress: identifier, url })
  }

  const chainId = URL_PARAM_TO_CHAIN_ID[chainName.toLowerCase()]
  if (!chainId) {
    return undefined
  }

  const result = await liquidityServicePost<{ position?: LiquidityPosition }>('GetPosition', {
    chainId,
    version: version === 'v3' ? Protocols.V3 : Protocols.V4,
    tokenId: identifier,
  })
  const position = result?.position
  if (!position) {
    return undefined
  }

  const [baseMetadata, quoteMetadata] = orderPoolDataByQuoteToken({
    token0IsQuote: isToken0Quote({
      token0Address: position.token0Address,
      quoteTokenAddress: position.quoteTokenAddress,
    }),
    data0: position.token0Metadata,
    data1: position.token1Metadata,
  })
  const baseSymbol = baseMetadata?.symbol ?? 'Unknown'
  const quoteSymbol = quoteMetadata?.symbol ?? 'Unknown'
  const name = getPoolName({ symbol0: baseSymbol, symbol1: quoteSymbol })
  const title = `${name} on Uniswap`
  // Twin of the transitional fallback in parseFeeData (parseLiquidityServicePosition.ts): until the
  // backend serves is_dynamic_fee on Position, the flag alone would render a dynamic position's
  // sentinel fee as a ~838% rate. Drop both together once a served position carries the flag.
  const feeTier = formatLiquidityFeeTier({
    feeTier: position.feeTier,
    isDynamicFee: position.isDynamicFee ?? position.feeTier === DYNAMIC_FEE_AMOUNT,
  })

  const origin = new URL(url).origin
  const image = `${origin}/api/image/positions/${version}/${chainName}/${identifier}`

  return {
    title,
    image,
    url,
    name,
    positionStatus: derivePositionStatus(position),
    poolData: {
      baseSymbol,
      quoteSymbol,
      feeTier,
      protocolVersion: version === 'v3' ? 'V3' : 'V4',
      baseImage: baseMetadata?.logoUrl,
      quoteImage: quoteMetadata?.logoUrl,
    },
  }
}
