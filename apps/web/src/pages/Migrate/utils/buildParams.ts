import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CheckApprovalLPRequest,
  MigrateV2ToV3LPPositionRequest,
  MigrateV3ToV4LPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  Protocols,
  V2CheckApprovalLPRequest,
  V3CheckApprovalLPRequest,
  V3Position,
  V4Position,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { V3_MIGRATOR_ADDRESSES } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { PositionState } from '~/components/Liquidity/Create/types'
import { V2PairInfo, V3PositionInfo } from '~/components/Liquidity/types'
import { getTokenOrZeroAddress } from '~/components/Liquidity/utils/currency'
import { getProtocols } from '~/components/Liquidity/utils/protocolVersion'

export function isV3ToV4MigrationPositionInfo(
  positionInfo: V2PairInfo | V3PositionInfo | undefined,
): positionInfo is V3PositionInfo {
  return positionInfo?.version === ProtocolVersion.V3
}

export function buildCheckLPApprovalRequestParams({
  positionInfo,
  address,
}: {
  positionInfo: V2PairInfo | V3PositionInfo
  address: string
}): CheckApprovalLPRequest | undefined {
  const protocol = getProtocols(positionInfo.version)

  if (protocol === undefined) {
    return undefined
  }

  const chainId = positionInfo.currency0Amount.currency.chainId
  switch (protocol) {
    case Protocols.V2:
      return new CheckApprovalLPRequest({
        checkApprovalLPRequest: {
          case: 'v2CheckApprovalLpRequest',
          value: new V2CheckApprovalLPRequest({
            protocol: getProtocols(ProtocolVersion.V2),
            walletAddress: address,
            chainId,
            positionToken: positionInfo.liquidityToken?.address,
            positionAmount: positionInfo.liquidityAmount?.quotient.toString() ?? '0',
            spenderAddress: V3_MIGRATOR_ADDRESSES[chainId],
            simulateTransaction: true,
          }),
        },
      })
    case Protocols.V3:
      return new CheckApprovalLPRequest({
        checkApprovalLPRequest: {
          case: 'v3CheckApprovalLpRequest',
          value: new V3CheckApprovalLPRequest({
            protocol: getProtocols(ProtocolVersion.V3),
            walletAddress: address,
            chainId,
            positionToken: positionInfo.tokenId,
            simulateTransaction: true,
          }),
        },
      })
    default:
      return undefined
  }
}

export function buildMigrationRequest({
  position,
  address,
  poolOrPair,
  ticks,
  positionState,
  approvalsNeeded,
  creatingPoolOrPair,
}: {
  position: V2PairInfo | V3PositionInfo
  address: string
  poolOrPair: Pair | V3Pool | V4Pool | undefined
  ticks: [Maybe<number>, Maybe<number>]
  positionState: PositionState
  approvalsNeeded: boolean
  creatingPoolOrPair?: boolean
}): MigrateV2ToV3LPPositionRequest | MigrateV3ToV4LPPositionRequest | undefined {
  const tickLower = ticks[0]
  const tickUpper = ticks[1]

  if (isV3ToV4MigrationPositionInfo(position)) {
    if (
      !poolOrPair ||
      !position.poolOrPair ||
      tickLower === undefined ||
      tickUpper === undefined ||
      !position.liquidity
    ) {
      return undefined
    }

    const destinationPool = poolOrPair as V4Pool
    const inputPosition = {
      pool: {
        token0: position.currency0Amount.currency.isNative ? ZERO_ADDRESS : position.currency0Amount.currency.address,
        token1: position.currency1Amount.currency.isNative ? ZERO_ADDRESS : position.currency1Amount.currency.address,
        fee: position.feeTier?.feeAmount,
        tickSpacing: position.tickSpacing ? Number(position.tickSpacing) : undefined,
      },
      tickLower: position.tickLower !== undefined ? position.tickLower : undefined,
      tickUpper: position.tickUpper !== undefined ? position.tickUpper : undefined,
    }
    const outputPosition = {
      pool: {
        token0: getTokenOrZeroAddress(destinationPool.currency0),
        token1: getTokenOrZeroAddress(destinationPool.currency1),
        fee: positionState.fee?.feeAmount,
        hooks: positionState.hook,
        tickSpacing: destinationPool.tickSpacing,
      },
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
    }

    return new MigrateV3ToV4LPPositionRequest({
      simulateTransaction: !approvalsNeeded,
      tokenId: Number(position.tokenId),
      walletAddress: address,
      chainId: position.currency0Amount.currency.chainId,
      inputPosition: new V3Position(inputPosition),
      inputPositionLiquidity: position.liquidity,
      amount0: position.currency0Amount.quotient.toString(),
      amount1: position.currency1Amount.quotient.toString(),
      outputPosition: new V4Position(outputPosition),
      initialPrice: creatingPoolOrPair ? destinationPool.sqrtRatioX96.toString() : undefined,
      expectedTokenOwed0RawAmount: position.token0UncollectedFees ?? '0',
      expectedTokenOwed1RawAmount: position.token1UncollectedFees ?? '0',
    })
  } else {
    if (tickLower === undefined || tickUpper === undefined) {
      return undefined
    }

    return new MigrateV2ToV3LPPositionRequest({
      simulateTransaction: !approvalsNeeded,
      walletAddress: address,
      chainId: position.currency0Amount.currency.chainId,
      v3Params: {
        pool: {
          token0: getTokenOrZeroAddress(position.currency0Amount.currency),
          token1: getTokenOrZeroAddress(position.currency1Amount.currency),
          fee: positionState.fee?.feeAmount,
          tickSpacing: positionState.fee?.tickSpacing,
        },
        tickLower: tickLower ?? 0,
        tickUpper: tickUpper ?? 0,
      },
    })
  }
}
