import { GraphQLApi } from '@universe/api'
import client from 'functions/client'
import { Data, PositionStatus } from 'functions/utils/cache'
import getPool from 'functions/utils/getPool'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'

const UNISWAP_DATA_API_URL = 'https://interface.gateway.uniswap.org/v2/data.v1.DataApiService/GetPosition'

// connect-rpc protocol version enum values
const protocolVersionMap: Record<string, number> = {
  v2: 1,
  v3: 2,
  v4: 3,
}

export default async function getPosition({
  version,
  chainName,
  identifier,
  url,
}: {
  version: 'v2' | 'v3' | 'v4'
  chainName: string
  identifier: string
  url: string
}): Promise<Data | undefined> {
  // V2 positions use the pair address, which is the pool address
  if (version === 'v2') {
    return getPool({ networkName: chainName, poolAddress: identifier, url })
  }

  // V3/V4: fetch position data from the Data API
  const chainId = URL_PARAM_TO_CHAIN_ID[chainName.toLowerCase()]

  const protocolVersion = protocolVersionMap[version]
  if (!protocolVersion) {
    return undefined
  }

  try {
    const response = await fetch(UNISWAP_DATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.uniswap.com',
      },
      body: JSON.stringify({
        chainId,
        protocolVersion,
        tokenId: identifier,
      }),
    })

    if (!response.ok) {
      return undefined
    }

    const result: Record<string, unknown> = await response.json()
    const position = result.position as Record<string, unknown> | undefined

    // V3 has token data directly on v3Position; V4 nests it under v4Position.poolPosition
    const v3Position = position?.v3Position as Record<string, unknown> | undefined
    const v4Position = position?.v4Position as Record<string, unknown> | undefined
    const positionData = v3Position ?? (v4Position?.poolPosition as Record<string, unknown> | undefined)
    if (!positionData) {
      return undefined
    }

    const token0 = positionData.token0 as Record<string, unknown> | undefined
    const token1 = positionData.token1 as Record<string, unknown> | undefined
    if (!token0 || !token1) {
      return undefined
    }

    const token0Symbol = (token0.symbol as string | undefined) ?? 'Unknown'
    const token1Symbol = (token1.symbol as string | undefined) ?? 'Unknown'
    const token0Address = token0.address as string | undefined
    const token1Address = token1.address as string | undefined
    const name = `${token0Symbol}/${token1Symbol}`
    const title = `${name} on Uniswap`
    const rawFeeTier = positionData.feeTier != null ? Number(positionData.feeTier) : undefined
    const feeTier = rawFeeTier != null ? `${rawFeeTier / 10_000}%` : undefined

    // The Data API doesn't return token logos, so fetch them via GraphQL
    const uppercaseChainName = chainName.toUpperCase()
    const [token0LogoResult, token1LogoResult] = await Promise.allSettled([
      token0Address
        ? client.query<GraphQLApi.TokenWebQuery>({
            query: GraphQLApi.TokenWebDocument,
            variables: { chain: uppercaseChainName, address: token0Address },
            errorPolicy: 'all',
          })
        : Promise.resolve(undefined),
      token1Address
        ? client.query<GraphQLApi.TokenWebQuery>({
            query: GraphQLApi.TokenWebDocument,
            variables: { chain: uppercaseChainName, address: token1Address },
            errorPolicy: 'all',
          })
        : Promise.resolve(undefined),
    ])

    const token0Image =
      token0LogoResult.status === 'fulfilled' ? token0LogoResult.value?.data?.token?.project?.logoUrl : undefined
    const token1Image =
      token1LogoResult.status === 'fulfilled' ? token1LogoResult.value?.data?.token?.project?.logoUrl : undefined

    const rawStatus = position?.status as string | undefined
    const positionStatus: PositionStatus | undefined =
      rawStatus === 'POSITION_STATUS_IN_RANGE'
        ? 'in_range'
        : rawStatus === 'POSITION_STATUS_OUT_OF_RANGE'
          ? 'out_of_range'
          : rawStatus === 'POSITION_STATUS_CLOSED'
            ? 'closed'
            : undefined

    const origin = new URL(url).origin
    const image = `${origin}/api/image/positions/${version}/${chainName}/${identifier}`

    const formattedAsset: Data = {
      title,
      image,
      url,
      name,
      positionStatus,
      poolData: {
        token0Symbol,
        token1Symbol,
        feeTier,
        protocolVersion: version === 'v3' ? GraphQLApi.ProtocolVersion.V3 : GraphQLApi.ProtocolVersion.V4,
        token0Image: token0Image ?? undefined,
        token1Image: token1Image ?? undefined,
      },
    }
    return formattedAsset
  } catch {
    return undefined
  }
}
