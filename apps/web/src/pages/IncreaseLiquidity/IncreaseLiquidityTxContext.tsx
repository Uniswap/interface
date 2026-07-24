import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { IncreasePositionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPAction, LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
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
import { useCheckLPApprovalQuery } from 'uniswap/src/data/apiClients/liquidityService/useCheckLPApprovalQuery'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
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
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/permitMethod'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useDynamicNativeSlippage } from '~/features/Liquidity/Create/hooks/useLPSlippageValues'
import { useIsLiquidityApprovalSimulationEnabled } from '~/features/Liquidity/hooks/preEstimatedLiquidityGasUtils'
import { useIncreasePositionDependentAmountFallback } from '~/features/Liquidity/hooks/useDependentAmountFallback'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getCheckLPApprovalRequestParams } from '~/features/Liquidity/utils/getCheckLPApprovalRequestParams'
import { hasLPFoTTransferError } from '~/features/Liquidity/utils/hasLPFoTTransferError'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { PositionField } from '~/types/position'

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

// oxlint-disable-next-line complexity
export function IncreaseLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const positionInfo = useModalInitialState(ModalName.AddLiquidity)

  const { derivedIncreaseLiquidityInfo, increaseLiquidityState, currentTransactionStep, preEstimatedGasFee } =
    useIncreaseLiquidityContext()
  const { customDeadline, customSlippageTolerance, isSlippageDirty } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
    isSlippageDirty: s.isSlippageDirty,
  }))
  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const { currencyAmounts, currencyMaxAmounts, error } = derivedIncreaseLiquidityInfo
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

  const increaseLiquidityApprovalParams = useMemo(() => {
    if (!positionInfo || !accountAddress || !currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
      return undefined
    }

    return getCheckLPApprovalRequestParams({
      walletAddress: accountAddress,
      protocolVersion: positionInfo.version,
      currencyAmounts,
      canBatchTransactions,
      action: LPAction.INCREASE,
    })
  }, [positionInfo, accountAddress, currencyAmounts, canBatchTransactions])

  const {
    approvalData: increaseLiquidityTokenApprovals,
    approvalLoading,
    approvalError,
    approvalRefetch,
  } = useCheckLPApprovalQuery({
    approvalQueryParams: increaseLiquidityApprovalParams,
    isQueryEnabled: !!increaseLiquidityApprovalParams && !error,
  })

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

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    v4BatchPermitData: permitData,
    token0Cancel,
    token1Cancel,
    token0PermitTransaction,
    token1PermitTransaction,
    gasFeeToken0Approval,
    gasFeeToken1Approval,
    gasFeePositionTokenApproval,
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

  const isApprovalSimEnabled = useIsLiquidityApprovalSimulationEnabled(positionInfo?.currency0Amount.currency.chainId)

  const token0 = currencyAmounts?.TOKEN0?.currency
  const token1 = currencyAmounts?.TOKEN1?.currency

  const token0Amount = currencyAmounts?.TOKEN0?.quotient.toString()
  const token1Amount = currencyAmounts?.TOKEN1?.quotient.toString()

  const nativeTokenBalance = useMemo(() => {
    if (positionInfo?.version !== ProtocolVersion.V4) {
      return undefined
    }
    if (currencyMaxAmounts?.TOKEN0?.currency.isNative) {
      return currencyMaxAmounts.TOKEN0.quotient.toString()
    }
    return undefined
  }, [positionInfo?.version, currencyMaxAmounts])

  const increaseCalldataQueryParams = useMemo((): IncreasePositionRequest | undefined => {
    if (!positionInfo || !accountAddress || !token0 || !token1 || !token0Amount || !token1Amount) {
      return undefined
    }

    const independentToken = exactField === PositionField.TOKEN0 ? token0 : token1
    const independentAmount = exactField === PositionField.TOKEN0 ? token0Amount : token1Amount

    return new IncreasePositionRequest({
      walletAddress: accountAddress,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: getProtocols(positionInfo.version),
      token0Address: getTokenOrZeroAddress(token0),
      token1Address: getTokenOrZeroAddress(token1),
      nftTokenId: positionInfo.tokenId ?? undefined,
      independentToken: new LPToken({
        tokenAddress: getTokenOrZeroAddress(independentToken),
        amount: independentAmount,
      }),
      slippageTolerance: nativeTokenBalance && !isSlippageDirty ? undefined : customSlippageTolerance,
      deadline: getTradeSettingsDeadline(customDeadline),
      simulateTransaction: !approvalsNeeded || isApprovalSimEnabled,
      includeApprovalSimulation: approvalsNeeded && isApprovalSimEnabled,
      nativeTokenBalance,
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
    isSlippageDirty,
    exactField,
    customDeadline,
    isApprovalSimEnabled,
    nativeTokenBalance,
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
      staleTime: 5 * ONE_SECOND_MS,
      enabled: isQueryEnabled && Boolean(increaseCalldataQueryParams),
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
    }),
  )

  const increase = increaseCalldata?.increase
  const actualGasFee = increaseCalldata?.gasFee

  useDynamicNativeSlippage({
    nativeTokenBalance,
    slippage: increaseCalldata?.slippage,
    isSlippageDirty,
  })

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
        // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
        ...increaseCalldataQueryParams,
      })
    }
  }

  const fallbackDependentAmount = useIncreasePositionDependentAmountFallback({
    queryParams: increaseCalldataQueryParams,
    isQueryEnabled: isQueryEnabled && Boolean(calldataError),
    exactField,
  })

  const dependentAmount = useMemo(() => {
    if (calldataError && fallbackDependentAmount) {
      return fallbackDependentAmount
    }
    const dependentToken = exactField === PositionField.TOKEN0 ? increaseCalldata?.token1 : increaseCalldata?.token0
    return dependentToken?.amount
  }, [increaseCalldata, calldataError, fallbackDependentAmount, exactField])

  // Use pre-estimated gas fee as fallback until real estimate is available
  const effectiveGasFee = actualGasFee ?? preEstimatedGasFee

  const { displayValue: calculatedGasFee } = useTransactionGasFee({ tx: increase, skip: !!effectiveGasFee })
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(increaseCalldata?.increase?.chainId) ?? undefined,
    effectiveGasFee || calculatedGasFee,
  )

  useEffect(() => {
    setTransactionError(
      getErrorMessageToDisplay({
        approvalError,
        calldataError,
      }),
    )
  }, [approvalError, calldataError])

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
    const validatedPermit = validatePermit(permitData)
    // Only treat as unsigned if permit data is present AND valid — invalid permit data
    // should fall back to the signed (simulated) path rather than skipping simulation.
    const unsigned = Boolean(validatedPermit)
    const txRequest = validateTransactionRequest(increase)

    const validatedToken0PermitTx = validateTransactionRequest(token0PermitTransaction)
    const validatedToken1PermitTx = validateTransactionRequest(token1PermitTransaction)

    const updatedIncreaseCalldataQueryParams = validatedPermit
      ? new IncreasePositionRequest({
          // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
          ...increaseCalldataQueryParams,
          v4BatchPermitData: validatedPermit,
        })
      : increaseCalldataQueryParams

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
      permit: validatedPermit ? { method: PermitMethod.TypedData, typedData: validatedPermit } : undefined,
      token0PermitTransaction: validatedToken0PermitTx,
      token1PermitTransaction: validatedToken1PermitTx,
      positionTokenPermitTransaction: undefined,
      increasePositionRequestArgs: updatedIncreaseCalldataQueryParams,
      txRequest,
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
    dependentAmount,
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
