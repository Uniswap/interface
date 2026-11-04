import { Data, type PoolProtocolVersion } from 'functions/utils/cache'
import {
  formatLiquidityFeeTier,
  type LiquidityTokenMetadata,
  liquidityServicePost,
} from 'functions/utils/liquidityService'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'

interface LiquidityPoolSummary {
  protocolVersion?: PoolProtocolVersion
  feeTier?: number
  isDynamicFee?: boolean
  token0Metadata?: LiquidityTokenMetadata
  token1Metadata?: LiquidityTokenMetadata
}

export default async function getPool({
  networkName,
  poolAddress,
  url,
}: {
  networkName: string
  poolAddress: string
  url: string
}): Promise<Data | undefined> {
  const chainId = URL_PARAM_TO_CHAIN_ID[networkName.toLowerCase()]
  if (!chainId) {
    return undefined
  }

  // GetPool resolves the protocol version from chain + identifier, so the request omits `version`
  // and takes only the pool reference — one call returns the tokens (with logos), fee, and version.
  const result = await liquidityServicePost<{ pool?: LiquidityPoolSummary }>('GetPool', {
    pool: { chainId, addressOrId: poolAddress },
  })
  const pool = result?.pool
  if (!pool) {
    return undefined
  }

  const protocolVersion: PoolProtocolVersion = pool.protocolVersion ?? 'V2'
  const origin = new URL(url).origin
  const image = origin + '/api/image/pools/' + networkName + '/' + poolAddress
  const feeTier = formatLiquidityFeeTier({
    feeTier: pool.feeTier,
    isDynamicFee: pool.isDynamicFee,
    isV2: protocolVersion === 'V2',
  })
  const name = `${pool.token0Metadata?.symbol ?? 'Unknown'}/${pool.token1Metadata?.symbol ?? 'Unknown'}`
  const title = `${name} on Uniswap`

  return {
    title,
    image,
    url,
    name,
    poolData: {
      token0Symbol: pool.token0Metadata?.symbol,
      token1Symbol: pool.token1Metadata?.symbol,
      feeTier,
      protocolVersion,
      token0Image: pool.token0Metadata?.logoUrl,
      token1Image: pool.token1Metadata?.logoUrl,
    },
  }
}
