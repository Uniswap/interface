import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { V3PositionInfo } from 'components/Liquidity/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { getCurrencyAddressForTradingApi, getCurrencyForProtocol } from 'pages/Pool/Positions/create/utils'
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useMigrateV3LpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useMigrateV3LpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  MigrateLPPositionRequest,
  ProtocolItems,
  UniversalRouterVersion,
} from 'uniswap/src/data/tradingApi/__generated__'
import {
  LiquidityTransactionType,
  MigrateV3PositionTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/types/steps'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

interface MigrateV3PositionTxContextType {
  txInfo?: MigrateV3PositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  error: boolean | string
  refetch?: () => void
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
  const [hasMigrateErrorResponse, setHasMigrateErrorResponse] = useState(false)

  const { derivedPositionInfo, positionState, currentTransactionStep } = useCreatePositionContext()
  const { feeValue0, feeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)
  const {
    derivedPriceRangeInfo,
    priceRangeState: { fullRange },
  } = usePriceRangeContext()

  const increaseLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !account.address) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: ProtocolItems.V3,
      positionToken: positionInfo.tokenId,
    }
  }, [positionInfo, account.address])

  const {
    data: migrateTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    headers: {
      'x-universal-router-version': UniversalRouterVersion._2_0,
    },
    staleTime: 5 * ONE_SECOND_MS,
    enabled: Boolean(increaseLiquidityApprovalParams),
  })

  if (approvalError) {
    logger.info(
      'MigrateV3LiquidityTxContext',
      'MigrateV3LiquidityTxContext',
      parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' }),
      {
        error: JSON.stringify(approvalError),
        increaseLiquidityApprovalParams: JSON.stringify(increaseLiquidityApprovalParams),
      },
    )
  }

  const approvalsNeeded = !approvalLoading && Boolean(migrateTokenApprovals?.permitData)

  const migratePositionRequestArgs: MigrateLPPositionRequest | undefined = useMemo(() => {
    if (
      !derivedPositionInfo ||
      !positionInfo ||
      !positionInfo.tokenId ||
      !account?.address ||
      !derivedPriceRangeInfo ||
      derivedPositionInfo.protocolVersion !== ProtocolVersion.V4 ||
      derivedPriceRangeInfo.protocolVersion !== ProtocolVersion.V4 ||
      !positionInfo.pool ||
      !positionInfo.liquidity
    ) {
      return undefined
    }
    const destinationPool = derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
    if (!destinationPool) {
      return undefined
    }
    const tickLower = fullRange ? derivedPriceRangeInfo.tickSpaceLimits[0] : derivedPriceRangeInfo.ticks?.[0]
    const tickUpper = fullRange ? derivedPriceRangeInfo.tickSpaceLimits[1] : derivedPriceRangeInfo.ticks?.[1]

    if (tickLower === undefined || tickUpper === undefined || !positionInfo.pool || !positionInfo.liquidity) {
      return undefined
    }
    return {
      simulateTransaction: !approvalsNeeded,
      inputProtocol: ProtocolItems.V3,
      tokenId: Number(positionInfo.tokenId),
      inputPosition: {
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
        },
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
      },
      inputPoolLiquidity: positionInfo.pool.liquidity.toString(),
      inputCurrentTick: positionInfo.pool.tickCurrent,
      inputSqrtRatioX96: positionInfo.pool.sqrtRatioX96?.toString(),
      inputPositionLiquidity: positionInfo.liquidity,

      outputProtocol: ProtocolItems.V4,
      outputPosition: {
        pool: {
          token0: getCurrencyAddressForTradingApi(destinationPool.currency0),
          token1: getCurrencyAddressForTradingApi(destinationPool.currency1),
          fee: positionState.fee.feeAmount,
          hooks: positionState.hook,
          tickSpacing: destinationPool.tickSpacing,
        },
        tickLower,
        tickUpper,
      },
      outputPoolLiquidity: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.liquidity.toString(),
      outputSqrtRatioX96: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.sqrtRatioX96.toString(),
      outputCurrentTick: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.tickCurrent,

      initialPrice: derivedPositionInfo.creatingPoolOrPair ? destinationPool.sqrtRatioX96.toString() : undefined,

      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account.address,
      expectedTokenOwed0RawAmount: feeValue0?.quotient.toString() ?? '0',
      expectedTokenOwed1RawAmount: feeValue1?.quotient.toString() ?? '0',
      amount0: positionInfo.currency0Amount.quotient.toString(),
      amount1: positionInfo.currency1Amount.quotient.toString(),
    }
  }, [
    derivedPositionInfo,
    positionInfo,
    account,
    derivedPriceRangeInfo,
    fullRange,
    positionState.fee.feeAmount,
    positionState.hook,
    feeValue0?.quotient,
    feeValue1?.quotient,
    approvalsNeeded,
  ])

  const isRangeValid =
    derivedPriceRangeInfo.protocolVersion !== ProtocolVersion.V2 &&
    !derivedPriceRangeInfo.invalidPrice &&
    !derivedPriceRangeInfo.invalidRange

  const isUserCommitedToMigrate =
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransactionStep ||
    currentTransactionStep?.step.type === TransactionStepType.MigratePositionTransactionStepAsync
  const isQueryEnabled =
    !isUserCommitedToMigrate &&
    !approvalLoading &&
    !approvalError &&
    Boolean(migratePositionRequestArgs) &&
    isRangeValid

  const {
    data: migrateCalldata,
    error: migrateError,
    refetch: migrateRefetch,
  } = useMigrateV3LpPositionCalldataQuery({
    params: migratePositionRequestArgs,
    refetchInterval: hasMigrateErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  useEffect(() => {
    setHasMigrateErrorResponse(!!migrateError)
  }, [migrateError, migratePositionRequestArgs])

  if (migrateError) {
    logger.info(
      'MigrateV3LiquidityTxContext',
      'MigrateV3LiquidityTxContext',
      parseErrorMessageTitle(migrateError, { defaultTitle: 'unknown MigrateLpPositionCalldataQuery' }),
      {
        error: JSON.stringify(migrateError),
        migrateCalldataQueryParams: JSON.stringify(migratePositionRequestArgs),
      },
    )
  }

  const validatedValue: MigrateV3PositionTxAndGasInfo | undefined = useMemo(() => {
    if (!migrateCalldata) {
      return undefined
    }

    const validatedPermitRequest = validatePermit(migrateTokenApprovals?.permitData)
    if (migrateTokenApprovals?.permitData && !validatedPermitRequest) {
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
      permit: validatedPermitRequest,
      protocolVersion: ProtocolVersion.V3,
      approvePositionTokenRequest: undefined,
      revokeToken0Request: undefined,
      revokeToken1Request: undefined,
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
        error: getErrorMessageToDisplay({ approvalError, calldataError: migrateError }),
        refetch: approvalError ? approvalRefetch : migrateError ? migrateRefetch : undefined,
      }}
    >
      {children}
    </MigrateV3PositionTxContext.Provider>
  )
}
