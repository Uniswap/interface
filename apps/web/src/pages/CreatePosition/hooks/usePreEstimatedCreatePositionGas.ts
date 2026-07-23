import { useQueries } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CreateClassicPositionRequest,
  CreatePositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPToken, V2PoolParameters } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import {
  CreatePositionExistingPoolParameters,
  CreateToken,
  PositionTickBounds,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  computePreEstimateIndependentAmount,
  useIsLiquidityGasPreEstimationEnabled,
} from '~/features/Liquidity/hooks/preEstimatedLiquidityGasUtils'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'

const queryObserverDefaults = {
  staleTime: 60_000,
  retry: 1,
} as const

/**
 * Pre-estimates gas for the create-position flow. Only the query matching
 * {@link protocolVersion} is enabled (V2 uses createClassicPosition; V3/V4 use createPosition).
 */
export function usePreEstimatedCreatePositionGas({
  protocolVersion,
  token0,
  token1,
  poolOrPair,
  poolId,
  ticks,
}: {
  protocolVersion: ProtocolVersion
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  poolOrPair: Pair | V3Pool | V4Pool | undefined
  poolId: string | undefined
  ticks: [Maybe<number>, Maybe<number>]
}): {
  gasFee: string | undefined
  isLoading: boolean
} {
  const accountAddress = useActiveAddress(Platform.EVM)
  const isV2 = protocolVersion === ProtocolVersion.V2

  const pair = poolOrPair instanceof Pair ? poolOrPair : undefined
  const v3OrV4Pool = poolOrPair instanceof Pair ? undefined : poolOrPair

  const chainId = token0?.chainId ?? token1?.chainId
  const isGasPreEstimateFeatureOn = useIsLiquidityGasPreEstimationEnabled(chainId)
  const hasNativeSide = token0?.isNative || token1?.isNative

  const [tickLower, tickUpper] = ticks

  const classicPreEstimate = useMemo(() => {
    if (!isV2 || !pair || !token0 || !token1 || chainId == null) {
      return undefined
    }
    return computePreEstimateIndependentAmount({
      poolOrPair: pair,
      tickLower: undefined,
      tickUpper: undefined,
      token0,
      token1,
    })
  }, [isV2, pair, token0, token1, chainId])

  const v3V4PreEstimate = useMemo(() => {
    if (
      isV2 ||
      !v3OrV4Pool ||
      !token0 ||
      !token1 ||
      chainId == null ||
      tickLower == null ||
      tickUpper == null ||
      tickLower >= tickUpper
    ) {
      return undefined
    }
    return computePreEstimateIndependentAmount({
      poolOrPair: v3OrV4Pool,
      tickLower,
      tickUpper,
      token0,
      token1,
    })
  }, [isV2, v3OrV4Pool, token0, token1, chainId, tickLower, tickUpper])

  const classicRequest = useMemo((): CreateClassicPositionRequest | undefined => {
    if (
      !isV2 ||
      !isGasPreEstimateFeatureOn ||
      !hasNativeSide ||
      !accountAddress ||
      !token0 ||
      !token1 ||
      !chainId ||
      !classicPreEstimate
    ) {
      return undefined
    }
    return new CreateClassicPositionRequest({
      walletAddress: accountAddress,
      poolParameters: new V2PoolParameters({
        token0Address: getTokenOrZeroAddress(token0),
        token1Address: getTokenOrZeroAddress(token1),
        chainId,
      }),
      independentToken: new LPToken({
        tokenAddress: getTokenOrZeroAddress(classicPreEstimate.independentCurrency),
        amount: classicPreEstimate.amountRaw,
      }),
      simulateTransaction: true,
      includeApprovalSimulation: true,
    })
  }, [isV2, isGasPreEstimateFeatureOn, hasNativeSide, accountAddress, token0, token1, chainId, classicPreEstimate])

  const v3V4Request = useMemo((): CreatePositionRequest | undefined => {
    if (
      isV2 ||
      !isGasPreEstimateFeatureOn ||
      !hasNativeSide ||
      !accountAddress ||
      !token0 ||
      !token1 ||
      !chainId ||
      !v3OrV4Pool ||
      !poolId ||
      tickLower == null ||
      tickUpper == null ||
      v3V4PreEstimate == null
    ) {
      return undefined
    }

    const protocol = getProtocols(protocolVersion)
    if (!protocol) {
      return undefined
    }

    return new CreatePositionRequest({
      walletAddress: accountAddress,
      pool: {
        case: 'existingPool' as const,
        value: new CreatePositionExistingPoolParameters({
          token0Address: getTokenOrZeroAddress(token0),
          token1Address: getTokenOrZeroAddress(token1),
          poolReference: poolId,
        }),
      },
      chainId,
      protocol,
      independentToken: new CreateToken({
        tokenAddress: getTokenOrZeroAddress(v3V4PreEstimate.independentCurrency),
        amount: v3V4PreEstimate.amountRaw,
      }),
      tickPrice: {
        case: 'tickBounds' as const,
        value: new PositionTickBounds({
          tickLower,
          tickUpper,
        }),
      },
      simulateTransaction: true,
      includeApprovalSimulation: true,
    })
  }, [
    isV2,
    isGasPreEstimateFeatureOn,
    hasNativeSide,
    accountAddress,
    token0,
    token1,
    chainId,
    v3OrV4Pool,
    poolId,
    tickLower,
    tickUpper,
    protocolVersion,
    v3V4PreEstimate,
  ])

  const classicEnabled = isV2 && Boolean(classicRequest)
  const v3V4Enabled = !isV2 && Boolean(v3V4Request)

  const [classicResult, v3V4Result] = useQueries({
    queries: [
      {
        ...liquidityQueries.createClassicPosition({
          params: classicRequest,
          ...queryObserverDefaults,
          enabled: classicEnabled,
        }),
      },
      {
        ...liquidityQueries.createPosition({
          params: v3V4Request,
          ...queryObserverDefaults,
          enabled: v3V4Enabled,
        }),
      },
    ],
  })

  return {
    gasFee: isV2 ? classicResult.data?.gasFee : v3V4Result.data?.gasFee,
    isLoading: isV2 ? classicResult.isLoading : v3V4Result.isLoading,
  }
}
