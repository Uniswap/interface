import { Data, type PoolProtocolVersion } from 'functions/utils/cache'
import {
  formatLiquidityFeeTier,
  type LiquidityTokenMetadata,
  liquidityServicePost,
} from 'functions/utils/liquidityService'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { isToken0Quote, orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'

interface LiquidityPoolSummary {
  protocolVersion?: PoolProtocolVersion
  feeTier?: number
  isDynamicFee?: boolean
  token0Address?: string
  token0Metadata?: LiquidityTokenMetadata
  token1Metadata?: LiquidityTokenMetadata
  quoteTokenAddress?: string
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
  const [baseMetadata, quoteMetadata] = orderPoolDataByQuoteToken({
    token0IsQuote: isToken0Quote({ token0Address: pool.token0Address, quoteTokenAddress: pool.quoteTokenAddress }),
    data0: pool.token0Metadata,
    data1: pool.token1Metadata,
  })
  const name = getPoolName({ symbol0: baseMetadata?.symbol ?? 'Unknown', symbol1: quoteMetadata?.symbol ?? 'Unknown' })
  const title = `${name} on Uniswap`

  return {
    title,
    image,
    url,
    name,
    poolData: {
      baseSymbol: baseMetadata?.symbol,
      quoteSymbol: quoteMetadata?.symbol,
      feeTier,
      protocolVersion,
      baseImage: baseMetadata?.logoUrl,
      quoteImage: quoteMetadata?.logoUrl,
    },
  }
}
