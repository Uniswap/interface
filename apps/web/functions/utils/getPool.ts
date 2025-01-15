import {
  V2PairDocument,
  V2PairQuery,
  V3PoolDocument,
  V3PoolQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Data } from 'utils/cache'
import client from '../client'

// eslint-disable-next-line import/no-unused-modules
export default async function getPool(networkName: string, poolAddress: string, url: string) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/pools/' + networkName + '/' + poolAddress
  const uppercaseNetworkName = networkName.toUpperCase()
  const { data: v3Data } = await client.query<V3PoolQuery>({
    query: V3PoolDocument,
    variables: {
      chain: uppercaseNetworkName,
      address: poolAddress,
    },
    errorPolicy: 'all',
  })
  const { data: v2Data } = await client.query<V2PairQuery>({
    query: V2PairDocument,
    variables: {
      chain: uppercaseNetworkName,
      address: poolAddress,
    },
    errorPolicy: 'all',
  })
  const data = v3Data?.v3Pool ?? v2Data?.v2Pair
  if (!data) {
    return undefined
  }

  const feeTier = `${(v3Data.v3Pool?.feeTier ?? 3000) / 10_000}%`
  const protocolVersion = data.protocolVersion
  const token0 = data?.token0
  const token1 = data?.token1
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
