import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useIncreasePositionDependentAmountFallback } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { hasLPFoTTransferError } from 'components/Liquidity/utils/hasLPFoTTransferError'
import { getProtocolItems } from 'components/Liquidity/utils/protocolVersion'
import { useAccount } from 'hooks/useAccount'
import { useModalInitialState } from 'hooks/useModalInitialState'
import { useIncreaseLiquidityContext } from 'pages/IncreaseLiquidity/IncreaseLiquidityContext'
import {
  createContext,
  Dispatch,
  type PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import {
  type IncreasePositionTxAndGasInfo,
  LiquidityTransactionType,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface IncreasePositionContextType {
  txInfo?: IncreasePositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  error: boolean | string
  refetch?: () => void
  dependentAmount?: string
  fotErrorToken: Maybe<CurrencyInfo>
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
}

const IncreaseLiquidityTxContext = createContext<IncreasePositionContextType | undefined>(undefined)

export function IncreaseLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const positionInfo = useModalInitialState(ModalName.AddLiquidity)

  const { derivedIncreaseLiquidityInfo, increaseLiquidityState, currentTransactionStep } = useIncreaseLiquidityContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
  }))
  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const generatePermitAsTransaction = useUniswapContext().getCanSignPermits?.(positionInfo?.chainId)

  const { currencyAmounts, error } = derivedIncreaseLiquidityInfo
  const { exactField } = increaseLiquidityState

  const account = useAccount()

  const increaseLiquidityApprovalParams: TradingApi.CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !account.address || !currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: getProtocolItems(positionInfo.version),
      token0: getTokenOrZeroAddress(positionInfo.currency0Amount.currency),
      token1: getTokenOrZeroAddress(positionInfo.currency1Amount.currency),
      amount0: currencyAmounts.TOKEN0.quotient.toString(),
      amount1: currencyAmounts.TOKEN1.quotient.toString(),
      generatePermitAsTransaction:
        positionInfo.version === ProtocolVersion.V4 ? generatePermitAsTransaction : undefined,
    }
  }, [positionInfo, account.address, currencyAmounts, generatePermitAsTransaction])

  const {
    data: increaseLiquidityTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    enabled: !!increaseLiquidityApprovalParams && !error,
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: {
        file: 'IncreaseLiquidityTxContext',
        function: 'useEffect',
      },
    })
  }

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    permitData,
    gasFeeToken0Approval,
    gasFeeToken1Approval,
    gasFeePositionTokenApproval,
    token0Cancel,
    token1Cancel,
    token0PermitTransaction,
    token1PermitTransaction,
    gasFeeToken0Permit,
    gasFeeToken1Permit,
  } = increaseLiquidityTokenApprovals ?? {}
  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency0Amount.currency.chainId,
    gasFeeToken0Approval,
  )
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency1Amount.currency.chainId,
    gasFeeToken1Approval,
  )
  const gasFeeLiquidityTokenUSD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.liquidityToken?.chainId,
    gasFeePositionTokenApproval,
  )
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency1Amount.currency.chainId,
    gasFeeToken0Permit,
  )
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(
    positionInfo?.currency1Amount.currency.chainId,
    gasFeeToken1Permit,
  )

  const approvalsNeeded =
    !approvalLoading &&
    Boolean(
      permitData ||
        token0Approval ||
        token1Approval ||
        positionTokenApproval ||
        token0PermitTransaction ||
        token1PermitTransaction,
    )

  const token0 = currencyAmounts?.TOKEN0?.currency
  const token1 = currencyAmounts?.TOKEN1?.currency

  const token0Amount = currencyAmounts?.TOKEN0?.quotient.toString()
  const token1Amount = currencyAmounts?.TOKEN1?.quotient.toString()

  const increaseCalldataQueryParams = useMemo((): TradingApi.IncreaseLPPositionRequest | undefined => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (
      !positionInfo ||
      !account.address ||
      !apiProtocolItems ||
      !token0 ||
      !token1 ||
      !token0Amount ||
      !token1Amount
    ) {
      return undefined
    }

    const [independentAmount, dependentAmount] =
      exactField === PositionField.TOKEN0 ? [token0Amount, token1Amount] : [token1Amount, token0Amount]
    const independentToken =
      exactField === PositionField.TOKEN0 ? TradingApi.IndependentToken.TOKEN_0 : TradingApi.IndependentToken.TOKEN_1

    return {
      simulateTransaction: !approvalsNeeded,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      independentAmount,
      independentToken,
      defaultDependentAmount: positionInfo.version === ProtocolVersion.V2 ? dependentAmount : undefined,
      position: {
        tickLower: positionInfo.tickLower !== undefined ? positionInfo.tickLower : undefined,
        tickUpper: positionInfo.tickUpper !== undefined ? positionInfo.tickUpper : undefined,
        pool: {
          token0: token0.isNative ? ZERO_ADDRESS : token0.address,
          token1: token1.isNative ? ZERO_ADDRESS : token1.address,
          fee: positionInfo.feeTier?.feeAmount,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
      slippageTolerance: customSlippageTolerance,
    }
  }, [
    account,
    positionInfo,
    token0,
    token1,
    token0Amount,
    token1Amount,
    approvalsNeeded,
    customSlippageTolerance,
    exactField,
  ])

  const currency0Info = useCurrencyInfo(currencyId(positionInfo?.currency0Amount.currency))
  const currency1Info = useCurrencyInfo(currencyId(positionInfo?.currency1Amount.currency))
  const token0FoTError = hasLPFoTTransferError(currency0Info, positionInfo?.version)
  const token1FoTError = hasLPFoTTransferError(currency1Info, positionInfo?.version)
  const fotErrorToken = token0FoTError || token1FoTError

  const isUserCommittedToIncrease =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommittedToIncrease &&
    !error &&
    !approvalLoading &&
    !approvalError &&
    Boolean(increaseCalldataQueryParams) &&
    !fotErrorToken

  const {
    data: increaseCalldata,
    isLoading: isCalldataLoading,
    error: calldataError,
    refetch: calldataRefetch,
  } = useIncreaseLpPositionCalldataQuery({
    params: increaseCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  const { increase, gasFee: actualGasFee, dependentAmount, sqrtRatioX96 } = increaseCalldata || {}

  if (calldataError) {
    const message = parseErrorMessageTitle(calldataError, { defaultTitle: 'unknown IncreaseLpPositionCalldataQuery' })
    logger.error(message, {
      tags: {
        file: 'IncreaseLiquidityTxContext',
        function: 'useEffect',
      },
    })

    if (increaseCalldataQueryParams) {
      sendAnalyticsEvent(InterfaceEventName.IncreaseLiquidityFailed, {
        message,
        ...increaseCalldataQueryParams,
      })
    }
  }

  const fallbackDependentAmount = useIncreasePositionDependentAmountFallback(
    increaseCalldataQueryParams,
    isQueryEnabled && Boolean(calldataError),
  )

  const { value: calculatedGasFee } = useTransactionGasFee({ tx: increase, skip: !!actualGasFee })
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(increaseCalldata?.increase?.chainId) ?? undefined,
    actualGasFee || calculatedGasFee,
  )

  useEffect(() => {
    setTransactionError(
      getErrorMessageToDisplay({
        approvalError,
        calldataError,
      }),
    )
  }, [approvalError, calldataError])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +token0Amount, +token1Amount
  useEffect(() => {
    setTransactionError(false)
  }, [token0Amount, token1Amount])

  const increaseLiquidityTxContext = useMemo((): IncreasePositionTxAndGasInfo | undefined => {
    if (
      !positionInfo ||
      approvalLoading ||
      isCalldataLoading ||
      !increaseCalldata ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts.TOKEN1
    ) {
      return undefined
    }

    const approveToken0Request = validateTransactionRequest(token0Approval)
    const approveToken1Request = validateTransactionRequest(token1Approval)
    const approvePositionTokenRequest = validateTransactionRequest(positionTokenApproval)
    const revokeToken0Request = validateTransactionRequest(token0Cancel)
    const revokeToken1Request = validateTransactionRequest(token1Cancel)
    const permit = validatePermit(permitData)
    const unsigned = Boolean(permitData)
    const txRequest = validateTransactionRequest(increase)
    const validatedToken0PermitTx = validateTransactionRequest(token0PermitTransaction)
    const validatedToken1PermitTx = validateTransactionRequest(token1PermitTransaction)

    return {
      type: LiquidityTransactionType.Increase,
      protocolVersion: positionInfo.version,
      action: {
        type: LiquidityTransactionType.Increase,
        currency0Amount: currencyAmounts.TOKEN0,
        currency1Amount: currencyAmounts.TOKEN1,
        liquidityToken: positionInfo.liquidityToken,
      },
      approveToken0Request,
      approveToken1Request,
      approvePositionTokenRequest,
      revokeToken0Request,
      revokeToken1Request,
      permit: permit ? { method: PermitMethod.TypedData, typedData: permit } : undefined, // TODO: make a PermitMethod.Transaction one if we get them from BE
      token0PermitTransaction: validatedToken0PermitTx,
      token1PermitTransaction: validatedToken1PermitTx,
      positionTokenPermitTransaction: undefined,
      increasePositionRequestArgs: { ...increaseCalldataQueryParams, batchPermitData: permitData ?? undefined },
      txRequest,
      sqrtRatioX96,
      unsigned,
    }
  }, [
    positionInfo,
    approvalLoading,
    isCalldataLoading,
    increaseCalldata,
    currencyAmounts?.TOKEN0,
    currencyAmounts?.TOKEN1,
    token0Approval,
    token1Approval,
    positionTokenApproval,
    token0Cancel,
    token1Cancel,
    permitData,
    increase,
    token0PermitTransaction,
    token1PermitTransaction,
    increaseCalldataQueryParams,
    sqrtRatioX96,
  ])

  const totalGasFee = useMemo(() => {
    const fees = [
      gasFeeToken0USD,
      gasFeeToken1USD,
      gasFeeLiquidityTokenUSD,
      increaseGasFeeUsd,
      gasFeeToken0PermitUSD,
      gasFeeToken1PermitUSD,
    ]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [
    gasFeeToken0USD,
    gasFeeToken1USD,
    gasFeeLiquidityTokenUSD,
    increaseGasFeeUsd,
    gasFeeToken0PermitUSD,
    gasFeeToken1PermitUSD,
  ])

  const value = {
    txInfo: increaseLiquidityTxContext,
    gasFeeEstimateUSD: totalGasFee ?? undefined,
    // in some cases there is an error with create but createCalldata still has a cached value
    dependentAmount: calldataError && fallbackDependentAmount ? fallbackDependentAmount : dependentAmount,
    error: transactionError,
    setTransactionError,
    refetch: approvalError ? approvalRefetch : calldataError ? calldataRefetch : undefined,
    fotErrorToken,
  }

  return <IncreaseLiquidityTxContext.Provider value={value}>{children}</IncreaseLiquidityTxContext.Provider>
}

export const useIncreaseLiquidityTxContext = (): IncreasePositionContextType => {
  const increaseContext = useContext(IncreaseLiquidityTxContext)

  if (!increaseContext) {
    throw new Error('`useIncreaseLiquidityTxContext` must be used inside of `IncreaseLiquidityTxContextProvider`')
  }

  return increaseContext
}
