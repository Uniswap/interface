import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { V3PositionInfo } from 'components/Liquidity/types'
import { getCurrencyForProtocol, getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { isInvalidPrice, isInvalidRange } from 'components/Liquidity/utils/priceRangeInfo'
import { useAccount } from 'hooks/useAccount'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useMigrateV3LpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useMigrateV3LpPositionCalldataQuery'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  LiquidityTransactionType,
  MigrateV3PositionTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface MigrateV3PositionTxContextType {
  txInfo?: MigrateV3PositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  transactionError: boolean | string
  refetch?: () => void
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
}

const MigrateV3PositionTxContext = createContext<MigrateV3PositionTxContextType | undefined>(undefined)

export function useMigrateV3TxContext() {
  const context = useContext(MigrateV3PositionTxContext)
  if (!context) {
    throw new Error('useMigrateV3TxContext must be used within a MigrateV3PositionTxContextProvider')
  }
  return context
}

export function MigrateV3PositionTxContextProvider({
  children,
  positionInfo,
}: PropsWithChildren<{ positionInfo: V3PositionInfo }>): JSX.Element {
  const account = useAccount()
  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const { creatingPoolOrPair, protocolVersion, positionState, currentTransactionStep, poolOrPair, ticks, price } =
    useCreateLiquidityContext()
  const generatePermitAsTransaction = useUniswapContext().getCanSignPermits?.(positionInfo.chainId)

  const migrateLiquidityApprovalParams: TradingApi.CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!account.address) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: TradingApi.ProtocolItems.V3,
      positionToken: positionInfo.tokenId,
      generatePermitAsTransaction,
    }
  }, [positionInfo, account.address, generatePermitAsTransaction])

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
        file: 'MigrateV3LiquidityTxContext',
        function: 'useEffect',
      },
    })
  }

  const { permitData, positionTokenPermitTransaction } = migrateTokenApprovals ?? {}

  const approvalsNeeded = !approvalLoading && Boolean(permitData || positionTokenPermitTransaction)

  const migratePositionRequestArgs: TradingApi.MigrateLPPositionRequest | undefined = useMemo(() => {
    if (
      !positionInfo.tokenId ||
      !account.address ||
      protocolVersion !== ProtocolVersion.V4 ||
      !positionInfo.poolOrPair ||
      !positionInfo.liquidity
    ) {
      return undefined
    }
    const destinationPool = poolOrPair as Pool | undefined
    if (!destinationPool) {
      return undefined
    }
    const tickLower = ticks[0]
    const tickUpper = ticks[1]

    if (tickLower === undefined || tickUpper === undefined || !positionInfo.liquidity) {
      return undefined
    }
    return {
      simulateTransaction: !approvalsNeeded,
      inputProtocol: TradingApi.ProtocolItems.V3,
      tokenId: Number(positionInfo.tokenId),
      inputPosition: {
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier?.feeAmount,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
        },
        tickLower: positionInfo.tickLower !== undefined ? positionInfo.tickLower : undefined,
        tickUpper: positionInfo.tickUpper !== undefined ? positionInfo.tickUpper : undefined,
      },
      inputPoolLiquidity: positionInfo.poolOrPair.liquidity.toString(),
      inputCurrentTick: positionInfo.poolOrPair.tickCurrent,
      inputSqrtRatioX96: positionInfo.poolOrPair.sqrtRatioX96.toString(),
      inputPositionLiquidity: positionInfo.liquidity,

      outputProtocol: TradingApi.ProtocolItems.V4,
      outputPosition: {
        pool: {
          token0: getTokenOrZeroAddress(destinationPool.currency0),
          token1: getTokenOrZeroAddress(destinationPool.currency1),
          fee: positionState.fee.feeAmount,
          hooks: positionState.hook,
          tickSpacing: destinationPool.tickSpacing,
        },
        tickLower: tickLower ?? undefined,
        tickUpper: tickUpper ?? undefined,
      },
      outputPoolLiquidity: creatingPoolOrPair ? undefined : destinationPool.liquidity.toString(),
      outputSqrtRatioX96: creatingPoolOrPair ? undefined : destinationPool.sqrtRatioX96.toString(),
      outputCurrentTick: creatingPoolOrPair ? undefined : destinationPool.tickCurrent,

      initialPrice: creatingPoolOrPair ? destinationPool.sqrtRatioX96.toString() : undefined,

      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account.address,
      expectedTokenOwed0RawAmount: positionInfo.token0UncollectedFees ?? '0',
      expectedTokenOwed1RawAmount: positionInfo.token1UncollectedFees ?? '0',
      amount0: positionInfo.currency0Amount.quotient.toString(),
      amount1: positionInfo.currency1Amount.quotient.toString(),
    }
  }, [
    protocolVersion,
    creatingPoolOrPair,
    positionInfo,
    account,
    poolOrPair,
    ticks,
    positionState.fee.feeAmount,
    positionState.hook,
    approvalsNeeded,
  ])

  const invalidPrice = isInvalidPrice(price)
  const invalidRange = isInvalidRange(ticks[0], ticks[1])
  const isRangeValid = protocolVersion !== ProtocolVersion.V2 && !invalidPrice && !invalidRange

  const isUserCommitedToMigrate =
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransactionAsync
  const isQueryEnabled =
    !isUserCommitedToMigrate &&
    !approvalLoading &&
    !approvalError &&
    Boolean(migratePositionRequestArgs) &&
    isRangeValid

  const {
    data: migrateCalldata,
    error: migrateCalldataError,
    refetch: migrateRefetch,
  } = useMigrateV3LpPositionCalldataQuery({
    params: migratePositionRequestArgs,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ calldataError: migrateCalldataError, approvalError }))
  }, [migrateCalldataError, approvalError])

  if (migrateCalldataError) {
    const message = parseErrorMessageTitle(migrateCalldataError, {
      defaultTitle: 'unknown MigrateLpPositionCalldataQuery',
    })
    logger.error(message, {
      tags: {
        file: 'MigrateV3LiquidityTxContext',
        function: 'useEffect',
      },
    })

    sendAnalyticsEvent(InterfaceEventName.MigrateLiquidityFailed, {
      message,
    })
  }

  const validatedValue: MigrateV3PositionTxAndGasInfo | undefined = useMemo(() => {
    if (!migrateCalldata) {
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

    const txRequest = validateTransactionRequest(migrateCalldata.migrate)
    if (!txRequest) {
      return undefined
    }

    const outputAmount0 = CurrencyAmount.fromRawAmount(
      getCurrencyForProtocol(positionInfo.currency0Amount.currency, ProtocolVersion.V4),
      positionInfo.currency0Amount.quotient,
    )
    const outputAmount1 = CurrencyAmount.fromRawAmount(
      getCurrencyForProtocol(positionInfo.currency1Amount.currency, ProtocolVersion.V4),
      positionInfo.currency1Amount.quotient,
    )

    return {
      type: LiquidityTransactionType.Migrate,
      unsigned: Boolean(migrateTokenApprovals?.permitData),
      migratePositionRequestArgs,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      permit: validatedPermitRequest
        ? { method: PermitMethod.TypedData, typedData: validatedPermitRequest }
        : undefined,
      protocolVersion: ProtocolVersion.V3,
      approvePositionTokenRequest: undefined,
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
      },
    }
  }, [
    migrateCalldata,
    migratePositionRequestArgs,
    migrateTokenApprovals,
    positionInfo.currency0Amount,
    positionInfo.currency1Amount,
  ])

  return (
    <MigrateV3PositionTxContext.Provider
      value={{
        txInfo: validatedValue,
        transactionError,
        setTransactionError,
        refetch: approvalError ? approvalRefetch : transactionError ? migrateRefetch : undefined,
      }}
    >
      {children}
    </MigrateV3PositionTxContext.Provider>
  )
}
