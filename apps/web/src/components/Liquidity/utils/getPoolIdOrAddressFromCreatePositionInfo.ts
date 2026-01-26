import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { PoolCache } from 'hooks/usePools'
import { getV3FactoryAddress } from 'uniswap/src/constants/v3Addresses'

export function getPoolIdOrAddressFromCreatePositionInfo({
  protocolVersion,
  poolOrPair,
  sdkCurrencies,
}: {
  protocolVersion: ProtocolVersion
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
}): string | undefined {
  if (!poolOrPair) {
    return undefined
  }

  switch (protocolVersion) {
    case ProtocolVersion.V2: {
      if ('liquidityToken' in poolOrPair) {
        return poolOrPair.liquidityToken.address
      }
      return undefined
    }
    case ProtocolVersion.V3: {
      if ('fee' in poolOrPair && 'chainId' in poolOrPair) {
        const factoryAddress = getV3FactoryAddress(poolOrPair.chainId)
        // If factory address is not configured for this chain, return undefined
        // This can happen for custom/new chains that haven't deployed V3
        if (!factoryAddress || !poolOrPair.chainId || !sdkCurrencies.TOKEN0 || !sdkCurrencies.TOKEN1) {
          return undefined
        }
        return PoolCache.getPoolAddress({
          factoryAddress,
          tokenA: sdkCurrencies.TOKEN0.wrapped,
          tokenB: sdkCurrencies.TOKEN1.wrapped,
          fee: poolOrPair.fee,
          chainId: poolOrPair.chainId,
        })
      }
      return undefined
    }
    case ProtocolVersion.V4:
    default: {
      if ('poolId' in poolOrPair) {
        return poolOrPair.poolId
      }
      return undefined
    }
  }
}
