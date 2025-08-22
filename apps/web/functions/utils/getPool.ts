import client from 'functions/client'
import { Data } from 'functions/utils/cache'
import {
  V2PairDocument,
  V2PairQuery,
  V3PoolDocument,
  V3PoolQuery,
  V4PoolDocument,
  V4PoolQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export default async function getPool({
  networkName,
  poolAddress,
  url,
}: {
  networkName: string
  poolAddress: string
  url: string
}) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/pools/' + networkName + '/' + poolAddress
  const uppercaseNetworkName = networkName.toUpperCase()
  const [v4Result, v3Result, v2Result] = await Promise.allSettled([
    client.query<V4PoolQuery>({
      query: V4PoolDocument,
      variables: {
        chain: uppercaseNetworkName,
        poolId: poolAddress,
      },
      errorPolicy: 'all',
    }),
    client.query<V3PoolQuery>({
      query: V3PoolDocument,
      variables: {
        chain: uppercaseNetworkName,
        address: poolAddress,
      },
      errorPolicy: 'all',
    }),
    client.query<V2PairQuery>({
      query: V2PairDocument,
      variables: {
        chain: uppercaseNetworkName,
        address: poolAddress,
      },
      errorPolicy: 'all',
    }),
  ])

  const v4Data = v4Result.status === 'fulfilled' ? v4Result.value.data : undefined
  const v3Data = v3Result.status === 'fulfilled' ? v3Result.value.data : undefined
  const v2Data = v2Result.status === 'fulfilled' ? v2Result.value.data : undefined
  const data = v4Data?.v4Pool ?? v3Data?.v3Pool ?? v2Data?.v2Pair
  if (!data) {
    return undefined
  }

  const feeTier = `${(v4Data?.v4Pool?.feeTier ?? v3Data?.v3Pool?.feeTier ?? 3000) / 10_000}%`
  const protocolVersion = data.protocolVersion
  const token0 = data.token0
  const token1 = data.token1
  const name = `${token0?.symbol}/${token1?.symbol}`
  const title = `${name} on Uniswap`

  const formattedAsset: Data = {
    title,
    image,
    url,
    name,
    poolData: {
      token0Symbol: token0?.symbol,
      token1Symbol: token1?.symbol,
      feeTier,
      protocolVersion,
      token0Image: token0?.project?.logoUrl,
      token1Image: token1?.project?.logoUrl,
    },
  }
  return formattedAsset
}
