import { useQuery } from '@tanstack/react-query'
import {
  CheckApprovalLPRequest,
  IncreaseLPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
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
import { useSelector } from 'react-redux'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
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
import { useIncreasePositionDependentAmountFallback } from '~/components/Liquidity/hooks/useDependentAmountFallback'
import { generateLiquidityServiceIncreaseCalldataParams } from '~/components/Liquidity/utils/generateLiquidityServiceIncreaseCalldata.ts'
import { getCheckLPApprovalRequestParams } from '~/components/Liquidity/utils/getCheckLPApprovalRequestParams'
import { hasLPFoTTransferError } from '~/components/Liquidity/utils/hasLPFoTTransferError'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'

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

  const { currencyAmounts, error } = derivedIncreaseLiquidityInfo
  const { exactField } = increaseLiquidityState

  const accountAddress = useActiveAddress(Platform.EVM)
  const isLiquidityBatchedTransactionsEnabled = useFeatureFlag(FeatureFlags.LiquidityBatchedTransactions)
  const canBatchTransactions =
    useUniswapContextSelector((ctx) => ctx.getCanBatchTransactions?.(positionInfo?.chainId)) &&
    positionInfo?.chainId !== UniverseChainId.Monad &&
    isLiquidityBatchedTransactionsEnabled

  const delegatedAddress = useSelector((state: { delegation: DelegatedState }) =>
    positionInfo?.chainId ? state.delegation.delegations[String(positionInfo.chainId)] : null,
  )

  const increaseLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !accountAddress || !currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
      return undefined
    }

    return getCheckLPApprovalRequestParams({
      walletAddress: accountAddress,
      protocolVersion: positionInfo.version,
      currencyAmounts,
      canBatchTransactions,
    })
  }, [positionInfo, accountAddress, currencyAmounts, canBatchTransactions])

  const {
    data: increaseLiquidityTokenApprovals,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useQuery(
    liquidityQueries.checkApproval({
      params: increaseLiquidityApprovalParams,
      staleTime: 5 * ONE_SECOND_MS,
      enabled: !!increaseLiquidityApprovalParams && !error,
    }),
  )

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: {
        file: 'IncreaseLiquidityTxContext',
        function: 'useEffect',
      },
      extra: {
        canBatchTransactions: canBatchTransactions ?? false,
        delegatedAddress,
      },
    })
  }

  const permitData = increaseLiquidityTokenApprovals?.permitData.value
  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
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

  const increaseCalldataQueryParams = useMemo((): IncreaseLPPositionRequest | undefined => {
    if (!positionInfo || !accountAddress || !token0 || !token1 || !token0Amount || !token1Amount) {
      return undefined
    }

    return generateLiquidityServiceIncreaseCalldataParams({
      token0,
      token1,
      exactField,
      token0Amount,
      token1Amount,
      approvalsNeeded,
      positionInfo,
      accountAddress,
      customSlippageTolerance,
      customDeadline,
    })
  }, [
    accountAddress,
    positionInfo,
    token0,
    token1,
    token0Amount,
    token1Amount,
    approvalsNeeded,
    customSlippageTolerance,
    exactField,
    customDeadline,
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
  } = useQuery(
    liquidityQueries.increasePosition({
      params: increaseCalldataQueryParams,
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isQueryEnabled && Boolean(increaseCalldataQueryParams),
    }),
  )

  const { increase, gasFee: actualGasFee, dependentAmount, sqrtRatioX96 } = increaseCalldata || {}

  if (calldataError) {
    const message = parseErrorMessageTitle(calldataError, { defaultTitle: 'unknown IncreaseLpPositionCalldataQuery' })
    logger.error(message, {
      tags: {
        file: 'IncreaseLiquidityTxContext',
        function: 'useEffect',
      },
      extra: {
        canBatchTransactions: canBatchTransactions ?? false,
        delegatedAddress,
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

    let updatedIncreaseCalldataQueryParams: IncreaseLPPositionRequest | undefined
    if (increaseCalldataQueryParams?.increaseLpPosition.case === 'v4IncreaseLpPosition') {
      const batchPermitData =
        increaseLiquidityTokenApprovals?.permitData.case === 'permitBatchData'
          ? increaseLiquidityTokenApprovals.permitData.value
          : undefined
      updatedIncreaseCalldataQueryParams = new IncreaseLPPositionRequest({
        ...increaseCalldataQueryParams,
        increaseLpPosition: {
          case: 'v4IncreaseLpPosition',
          value: {
            ...increaseCalldataQueryParams.increaseLpPosition.value,
            batchPermitData,
          },
        },
      })
    } else {
      updatedIncreaseCalldataQueryParams = increaseCalldataQueryParams
    }

    return {
      type: LiquidityTransactionType.Increase,
      canBatchTransactions: canBatchTransactions ?? false,
      delegatedAddress,
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
      increasePositionRequestArgs: updatedIncreaseCalldataQueryParams,
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
    increaseLiquidityTokenApprovals,
    sqrtRatioX96,
    canBatchTransactions,
    delegatedAddress,
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
