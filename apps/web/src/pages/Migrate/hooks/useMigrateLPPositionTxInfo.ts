import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  MigrateV2ToV3LPPositionRequest,
  MigrateV3ToV4LPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { V3Position, V4Position } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { PositionFlowStep, PositionState } from 'components/Liquidity/Create/types'
import { V2PairInfo, V3PositionInfo } from 'components/Liquidity/types'
import { getCurrencyForProtocol, getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { isInvalidPrice, isInvalidRange } from 'components/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useMigrateV2ToV3LPPositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useMigrateV2ToV3LPPositionQuery'
import { useMigrateV3ToV4LPPositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useMigrateV3ToV4LPPositionQuery'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useMigrateV3LpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useMigrateV3LpPositionCalldataQuery'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  LiquidityTransactionType,
  MigratePositionTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

function isV3ToV4MigrationPositionInfo(
  positionInfo: V2PairInfo | V3PositionInfo | undefined,
): positionInfo is V3PositionInfo {
  return positionInfo?.version === ProtocolVersion.V3
}

function buildApprovalParams({
  positionInfo,
  address,
}: {
  positionInfo: V2PairInfo | V3PositionInfo
  address: string
}): TradingApi.CheckApprovalLPRequest | undefined {
  if (isV3ToV4MigrationPositionInfo(positionInfo)) {
    return {
      simulateTransaction: true,
      walletAddress: address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: TradingApi.ProtocolItems.V3,
      positionToken: positionInfo.tokenId,
      generatePermitAsTransaction: false, // when batching is supported check canBatchTransactions
    }
  } else {
    return {
      simulateTransaction: true,
      walletAddress: address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: TradingApi.ProtocolItems.V2,
      positionToken: positionInfo.liquidityToken.address,
      positionAmount: positionInfo.liquidityAmount?.quotient.toString() ?? '0',
    }
  }
}

function buildMigrationRequest({
  position,
  address,
  poolOrPair,
  ticks,
  positionState,
  approvalsNeeded,
  creatingPoolOrPair,
  isMigrateLiquidityApiEnabled,
}: {
  position: V2PairInfo | V3PositionInfo
  address: string
  poolOrPair: Pair | V3Pool | V4Pool | undefined
  ticks: [Maybe<number>, Maybe<number>]
  positionState: PositionState
  approvalsNeeded: boolean
  creatingPoolOrPair?: boolean
  isMigrateLiquidityApiEnabled: boolean
}): MigrateV2ToV3LPPositionRequest | TradingApi.MigrateLPPositionRequest | MigrateV3ToV4LPPositionRequest | undefined {
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

    return isMigrateLiquidityApiEnabled
      ? new MigrateV3ToV4LPPositionRequest({
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
      : ({
          simulateTransaction: !approvalsNeeded,
          inputProtocol: TradingApi.ProtocolItems.V3,
          tokenId: Number(position.tokenId),
          inputPosition,
          inputPoolLiquidity: position.poolOrPair.liquidity.toString(),
          inputCurrentTick: position.poolOrPair.tickCurrent,
          inputSqrtRatioX96: position.poolOrPair.sqrtRatioX96.toString(),
          inputPositionLiquidity: position.liquidity,

          outputProtocol: TradingApi.ProtocolItems.V4,
          outputPosition,
          outputPoolLiquidity: creatingPoolOrPair ? undefined : destinationPool.liquidity.toString(),
          outputSqrtRatioX96: creatingPoolOrPair ? undefined : destinationPool.sqrtRatioX96.toString(),
          outputCurrentTick: creatingPoolOrPair ? undefined : destinationPool.tickCurrent,

          initialPrice: creatingPoolOrPair ? destinationPool.sqrtRatioX96.toString() : undefined,

          chainId: position.currency0Amount.currency.chainId,
          walletAddress: address,
          expectedTokenOwed0RawAmount: position.token0UncollectedFees ?? '0',
          expectedTokenOwed1RawAmount: position.token1UncollectedFees ?? '0',
          amount0: position.currency0Amount.quotient.toString(),
          amount1: position.currency1Amount.quotient.toString(),
        } satisfies TradingApi.MigrateLPPositionRequest)
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

export interface MigratePositionTxContextType {
  txInfo?: MigratePositionTxAndGasInfo
  refundedAmounts?: { TOKEN0?: Maybe<CurrencyAmount<Currency>>; TOKEN1?: Maybe<CurrencyAmount<Currency>> }
  transactionError: boolean | string
  refetch?: () => void
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
}

/**
 * Unified hook for migrating liquidity positions between protocol versions.
 * Supports V2->V3 and V3->V4 migrations using a strategy pattern with protocol adapters.
 *
 * @param positionInfo - V2PairInfo or V3PositionInfo
 * @returns Transaction info, error state, and refetch function
 */
export function useMigrateLPPositionTxInfo({
  positionInfo,
}: {
  positionInfo: V2PairInfo | V3PositionInfo | undefined
}): MigratePositionTxContextType {
  const address = useActiveAddress(Platform.EVM)
  const [transactionError, setTransactionError] = useState<string | boolean>(false)
  const isMigrateLiquidityApiEnabled = getFeatureFlag(FeatureFlags.MigrateLiquidityApi)

  const { creatingPoolOrPair, protocolVersion, positionState, currentTransactionStep, poolOrPair, ticks, price, step } =
    useCreateLiquidityContext()

  const invalidPrice = isInvalidPrice(price)
  const invalidRange = isInvalidRange(ticks[0], ticks[1])
  const isRangeValid = protocolVersion !== ProtocolVersion.V2 && !invalidPrice && !invalidRange

  const migrateLiquidityApprovalParams = useMemo(() => {
    if (!positionInfo || !address) {
      return undefined
    }

    return buildApprovalParams({ positionInfo, address })
  }, [positionInfo, address])

  const {
    data: migrateTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: migrateLiquidityApprovalParams,
    headers: {
      'x-universal-router-version': TradingApi.UniversalRouterVersion._2_0,
    },
    staleTime: 5 * ONE_SECOND_MS,
    enabled: Boolean(migrateLiquidityApprovalParams),
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: {
        file: 'useMigrateLPPositionTxInfo',
        function: 'useCheckLpApprovalQuery',
      },
    })
  }

  const approvalsNeeded = useMemo(() => {
    if (approvalLoading) {
      return false
    }

    if (!migrateTokenApprovals) {
      return false
    }

    // v2 uses positionTokenApproval
    // v3 uses permitData or positionTokenPermitTransaction
    return Boolean(
      migrateTokenApprovals.positionTokenApproval ||
        migrateTokenApprovals.permitData ||
        migrateTokenApprovals.positionTokenPermitTransaction,
    )
  }, [approvalLoading, migrateTokenApprovals])

  const migratePositionRequestArgs = useMemo(() => {
    if (!positionInfo || !address) {
      return undefined
    }

    return buildMigrationRequest({
      position: positionInfo,
      address,
      poolOrPair,
      ticks,
      positionState,
      approvalsNeeded,
      creatingPoolOrPair,
      isMigrateLiquidityApiEnabled,
    })
  }, [
    positionInfo,
    address,
    poolOrPair,
    ticks,
    positionState,
    approvalsNeeded,
    creatingPoolOrPair,
    isMigrateLiquidityApiEnabled,
  ])

  const isUserCommitedToMigrate =
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommitedToMigrate &&
    !approvalLoading &&
    !approvalError &&
    Boolean(migratePositionRequestArgs) &&
    isRangeValid &&
    step > PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER

  const isV3ToV4Migration = isV3ToV4MigrationPositionInfo(positionInfo)
  const v2ToV3Result = useMigrateV2ToV3LPPositionQuery({
    params: isV3ToV4Migration ? undefined : (migratePositionRequestArgs as MigrateV2ToV3LPPositionRequest),
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled && !isV3ToV4Migration,
  })

  const v3ToV4ResultLegacy = useMigrateV3LpPositionCalldataQuery({
    params: isV3ToV4Migration ? (migratePositionRequestArgs as TradingApi.MigrateLPPositionRequest) : undefined,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled && isV3ToV4Migration && !isMigrateLiquidityApiEnabled,
  })

  const v3ToV4Result = useMigrateV3ToV4LPPositionQuery({
    params: isV3ToV4Migration ? (migratePositionRequestArgs as MigrateV3ToV4LPPositionRequest) : undefined,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled && isV3ToV4Migration && isMigrateLiquidityApiEnabled,
  })

  const {
    data: migrateCalldata,
    error: migrateCalldataError,
    refetch: migrateRefetch,
  } = isV3ToV4Migration ? (isMigrateLiquidityApiEnabled ? v3ToV4Result : v3ToV4ResultLegacy) : v2ToV3Result

  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ calldataError: migrateCalldataError, approvalError }))
  }, [migrateCalldataError, approvalError])

  if (migrateCalldataError) {
    const message = parseErrorMessageTitle(migrateCalldataError, {
      defaultTitle: 'unknown MigrateLpPositionCalldataQuery',
    })
    logger.error(message, {
      tags: {
        file: 'useMigrateLPPositionTxInfo',
        function: 'migrateQuery',
      },
    })

    sendAnalyticsEvent(InterfaceEventName.MigrateLiquidityFailed, {
      message,
    })
  }

  const refundedAmounts = useMemo(() => {
    if (!migrateCalldata || !positionInfo) {
      return undefined
    }

    return {
      TOKEN0:
        'estimatedRefundToken0' in migrateCalldata && migrateCalldata.estimatedRefundToken0
          ? CurrencyAmount.fromRawAmount(positionInfo.currency0Amount.currency, migrateCalldata.estimatedRefundToken0)
          : undefined,
      TOKEN1:
        'estimatedRefundToken1' in migrateCalldata && migrateCalldata.estimatedRefundToken1
          ? CurrencyAmount.fromRawAmount(positionInfo.currency1Amount.currency, migrateCalldata.estimatedRefundToken1)
          : undefined,
    }
  }, [migrateCalldata, positionInfo])

  const validatedValue: MigratePositionTxAndGasInfo | undefined = useMemo(() => {
    if (!positionInfo || !migrateCalldata) {
      return undefined
    }

    const validatedPermitRequest = validatePermit(migrateTokenApprovals?.permitData)
    if (migrateTokenApprovals?.permitData && !validatedPermitRequest) {
      return undefined
    }

    const validatedPositionTokenPermitTransaction = validateTransactionRequest(
      migrateTokenApprovals?.positionTokenPermitTransaction,
    )
    if (migrateTokenApprovals?.positionTokenPermitTransaction && !validatedPositionTokenPermitTransaction) {
      return undefined
    }

    const validatedPositionTokenApprovalTransaction = validateTransactionRequest(
      migrateTokenApprovals?.positionTokenApproval,
    )
    if (migrateTokenApprovals?.positionTokenApproval && !validatedPositionTokenApprovalTransaction) {
      return undefined
    }

    const txRequest = validateTransactionRequest(migrateCalldata.migrate)
    if (!txRequest) {
      return undefined
    }

    const outputAmount0 = CurrencyAmount.fromRawAmount(
      isV3ToV4Migration
        ? getCurrencyForProtocol(positionInfo.currency0Amount.currency, ProtocolVersion.V4)
        : getCurrencyForProtocol(positionInfo.currency0Amount.currency, ProtocolVersion.V3),
      positionInfo.currency0Amount.quotient,
    )
    const outputAmount1 = CurrencyAmount.fromRawAmount(
      isV3ToV4Migration
        ? getCurrencyForProtocol(positionInfo.currency1Amount.currency, ProtocolVersion.V4)
        : getCurrencyForProtocol(positionInfo.currency1Amount.currency, ProtocolVersion.V3),
      positionInfo.currency1Amount.quotient,
    )

    return {
      type: LiquidityTransactionType.Migrate,
      canBatchTransactions: false, // when batching is supported check canBatchTransactions
      migratePositionRequestArgs: isV3ToV4Migration
        ? (migratePositionRequestArgs as TradingApi.MigrateLPPositionRequest)
        : undefined,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      unsigned: Boolean(validatedPermitRequest),
      permit: validatedPermitRequest
        ? { method: PermitMethod.TypedData, typedData: validatedPermitRequest }
        : undefined,
      approvePositionTokenRequest: validatedPositionTokenApprovalTransaction,
      revokeToken0Request: undefined,
      revokeToken1Request: undefined,
      token0PermitTransaction: undefined,
      token1PermitTransaction: undefined,
      positionTokenPermitTransaction: validatedPositionTokenPermitTransaction,
      txRequest,
      action: {
        type: LiquidityTransactionType.Migrate,
        currency0Amount: outputAmount0,
        currency1Amount: outputAmount1,
        liquidityToken: positionInfo.liquidityToken,
      },
    }
  }, [positionInfo, migrateCalldata, migrateTokenApprovals, migratePositionRequestArgs, isV3ToV4Migration])

  return {
    txInfo: validatedValue,
    transactionError,
    refundedAmounts,
    setTransactionError,
    refetch: approvalError ? approvalRefetch : transactionError ? migrateRefetch : undefined,
  }
}
