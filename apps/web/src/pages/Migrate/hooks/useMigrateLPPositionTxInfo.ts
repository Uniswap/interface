import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  MigrateV2ToV3LPPositionRequest,
  MigrateV3ToV4LPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
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
import { PositionFlowStep } from '~/components/Liquidity/Create/types'
import { V2PairInfo, V3PositionInfo } from '~/components/Liquidity/types'
import { getCurrencyForProtocol } from '~/components/Liquidity/utils/currency'
import { isInvalidPrice, isInvalidRange } from '~/components/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import {
  buildCheckLPApprovalRequestParams,
  buildMigrationRequest,
  isV3ToV4MigrationPositionInfo,
} from '~/pages/Migrate/utils/buildParams'

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
  const delegatedAddress = useSelector((state: { delegation: DelegatedState }) =>
    positionInfo?.chainId ? state.delegation.delegations[String(positionInfo.chainId)] : null,
  )
  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const { creatingPoolOrPair, protocolVersion, positionState, currentTransactionStep, poolOrPair, ticks, price, step } =
    useCreateLiquidityContext()

  const invalidPrice = isInvalidPrice(price)
  const invalidRange = isInvalidRange(ticks[0], ticks[1])
  const isRangeValid = protocolVersion !== ProtocolVersion.V2 && !invalidPrice && !invalidRange

  const liquidityServiceApprovalParams = useMemo(() => {
    if (!positionInfo || !address) {
      return undefined
    }

    return buildCheckLPApprovalRequestParams({ positionInfo, address })
  }, [positionInfo, address])

  const {
    data: migrateTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useQuery(
    liquidityQueries.checkApproval({
      params: liquidityServiceApprovalParams,
      staleTime: 5 * ONE_SECOND_MS,
      enabled: Boolean(liquidityServiceApprovalParams),
    }),
  )

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
    // v3 uses permitData
    return Boolean(migrateTokenApprovals.positionTokenApproval || migrateTokenApprovals.permitData.value)
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
    })
  }, [positionInfo, address, poolOrPair, ticks, positionState, approvalsNeeded, creatingPoolOrPair])

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
  const v2ToV3Result = useQuery(
    liquidityQueries.migrateV2ToV3({
      params: isV3ToV4Migration ? undefined : (migratePositionRequestArgs as MigrateV2ToV3LPPositionRequest),
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isQueryEnabled && !isV3ToV4Migration,
    }),
  )

  const v3ToV4Result = useQuery(
    liquidityQueries.migrateV3ToV4({
      params: isV3ToV4Migration ? (migratePositionRequestArgs as MigrateV3ToV4LPPositionRequest) : undefined,
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isQueryEnabled && isV3ToV4Migration,
    }),
  )

  const {
    data: migrateCalldata,
    error: migrateCalldataError,
    refetch: migrateRefetch,
  } = isV3ToV4Migration ? v3ToV4Result : v2ToV3Result

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

    const validatedPermitRequest = validatePermit(migrateTokenApprovals?.permitData.value)
    if (migrateTokenApprovals?.permitData.value && !validatedPermitRequest) {
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
      delegatedAddress,
      migratePositionRequestArgs: isV3ToV4Migration
        ? (migratePositionRequestArgs as MigrateV3ToV4LPPositionRequest)
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
      positionTokenPermitTransaction: undefined,
      txRequest,
      action: {
        type: LiquidityTransactionType.Migrate,
        currency0Amount: outputAmount0,
        currency1Amount: outputAmount1,
        liquidityToken: positionInfo.liquidityToken,
      },
    }
  }, [
    positionInfo,
    migrateCalldata,
    migrateTokenApprovals,
    migratePositionRequestArgs,
    isV3ToV4Migration,
    delegatedAddress,
  ])

  return {
    txInfo: validatedValue,
    transactionError,
    refundedAmounts,
    setTransactionError,
    refetch: approvalError ? approvalRefetch : transactionError ? migrateRefetch : undefined,
  }
}
