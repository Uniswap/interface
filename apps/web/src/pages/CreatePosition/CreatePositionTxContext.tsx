/* oxlint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CreateLPPositionRequest,
  CreateLPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  CreateClassicPositionResponse,
  CreatePositionRequest,
  CreatePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPAction } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useActiveSmartPool } from '~/state/application/hooks'
import { useSelector } from 'react-redux'
import { PositionField } from '~/types/position'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLPApprovalQuery } from 'uniswap/src/data/apiClients/liquidityService/useCheckLPApprovalQuery'
import { useCreatePositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useCreatePositionQuery'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { CreatePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { logger } from 'utilities/src/logger/logger'
import { useDepositInfo } from '~/components/Liquidity/Create/hooks/useDepositInfo'
import { useDynamicNativeSlippage } from '~/components/Liquidity/Create/hooks/useLPSlippageValues'
import { useCreatePositionDependentAmountFallback } from '~/components/Liquidity/hooks/useDependentAmountFallback'
import { generateLiquidityServiceCreateCalldataQueryParams } from '~/components/Liquidity/utils/generateLiquidityServiceCreateCalldata'
import { getCheckLPApprovalRequestParams } from '~/components/Liquidity/utils/getCheckLPApprovalRequestParams'
import { isInvalidRange, isOutOfRange } from '~/components/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { generateCreatePositionTxRequest } from '~/pages/CreatePosition/generateCreatePositionTxRequest'


interface CreatePositionTxContextType {
  txInfo?: CreatePositionTxAndGasInfo
  gasFeeEstimateUSD?: Maybe<CurrencyAmount<Currency>>
  transactionError: boolean | string
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
  dependentAmount?: string
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  inputError?: ReactNode
  formattedAmounts?: { [field in PositionField]?: string }
  currencyAmountsUSDValue?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
}

const CreatePositionTxContext = createContext<CreatePositionTxContextType | undefined>(undefined)

// oxlint-disable-next-line complexity
export function CreatePositionTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const {
    protocolVersion,
    currencies,
    ticks,
    poolOrPair,
    depositState,
    creatingPoolOrPair,
    poolId,
    currentTransactionStep,
    positionState,
    setRefetch,
  } = useCreateLiquidityContext()
  const evmAddress = useActiveAddress(Platform.EVM)
  const smartPoolAddress = useActiveSmartPool().address
  const account = evmAddress ? { address: evmAddress } : undefined
  const { TOKEN0, TOKEN1 } = currencies.display
  const { exactField } = depositState

  const invalidRange = protocolVersion !== ProtocolVersion.V2 && isInvalidRange(ticks[0], ticks[1])
  const depositInfoProps = useMemo(() => {
    const [tickLower, tickUpper] = ticks
    const outOfRange = isOutOfRange({
      poolOrPair,
      lowerTick: tickLower,
      upperTick: tickUpper,
    })

    return {
      protocolVersion,
      poolOrPair,
      address: smartPoolAddress ?? evmAddress,
      token0: TOKEN0,
      token1: TOKEN1,
      tickLower: protocolVersion !== ProtocolVersion.V2 ? (tickLower ?? undefined) : undefined,
      tickUpper: protocolVersion !== ProtocolVersion.V2 ? (tickUpper ?? undefined) : undefined,
      exactField,
      exactAmounts: depositState.exactAmounts,
      skipDependentAmount: protocolVersion === ProtocolVersion.V2 ? false : outOfRange || invalidRange,
      isSmartPool: !!smartPoolAddress,
    }
  }, [TOKEN0, TOKEN1, exactField, ticks, poolOrPair, depositState, evmAddress, smartPoolAddress, protocolVersion, invalidRange])

  const {
    currencyMaxAmounts,
    currencyAmounts,
    error: inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
  } = useDepositInfo(depositInfoProps)

  const { customDeadline, customSlippageTolerance, isSlippageDirty } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
    isSlippageDirty: s.isSlippageDirty,
  }))
  const isLiquidityBatchedTransactionsEnabled = useFeatureFlag(FeatureFlags.LiquidityBatchedTransactions)
  const isLpDynamicNativeSlippageEnabled = useFeatureFlag(FeatureFlags.LpDynamicNativeSlippage)
  const isCreatePositionV2 = useFeatureFlag(FeatureFlags.CreatePositionV2)
  const isCheckApprovalV2 = useFeatureFlag(FeatureFlags.CheckApprovalV2)
  const canBatchTransactions =
    (useUniswapContextSelector((ctx) => ctx.getCanBatchTransactions?.(poolOrPair?.chainId)) ?? false) &&
    poolOrPair?.chainId !== UniverseChainId.Monad &&
    isLiquidityBatchedTransactionsEnabled

  const delegatedAddress = useSelector((state: { delegation: DelegatedState }) =>
    poolOrPair?.chainId ? state.delegation.delegations[String(poolOrPair.chainId)] : null,
  )

  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const addLiquidityApprovalParams = useMemo(() => {
    // Smart pools handle approvals internally; skip the check to avoid blocking the calldata query
    if (smartPoolAddress) {
      return undefined
    }
    return getCheckLPApprovalRequestParams({
      walletAddress: evmAddress,
      protocolVersion,
      currencyAmounts,
      canBatchTransactions,
      action: LPAction.CREATE,
      isCheckApprovalV2,
    })
  }, [evmAddress, smartPoolAddress, protocolVersion, currencyAmounts, canBatchTransactions, isCheckApprovalV2])

  const {
    approvalData: approvalCalldata,
    approvalError,
    approvalLoading,
    approvalRefetch,
  } = useCheckLPApprovalQuery({
    approvalQueryParams: addLiquidityApprovalParams,
    isQueryEnabled: !!addLiquidityApprovalParams && !inputError && !transactionError && !invalidRange,
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: { file: 'CreatePositionTxContext', function: 'useEffect' },
      extra: {
        canBatchTransactions,
        delegatedAddress,
      },
    })
  }

  const { gasFeeToken0Approval, gasFeeToken1Approval, gasFeeToken0Permit, gasFeeToken1Permit } = approvalCalldata ?? {}
  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, gasFeeToken0Approval)
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, gasFeeToken1Approval)
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, gasFeeToken0Permit)
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, gasFeeToken1Permit)

  const nativeTokenBalance = useMemo(() => {
    if (!isLpDynamicNativeSlippageEnabled || protocolVersion !== ProtocolVersion.V4) {
      return undefined
    }
    // Only set native token balance if the token0 is the native token
    // other tokens (CELO) are not treated as native tokens
    if (currencyMaxAmounts?.TOKEN0?.currency.isNative) {
      return currencyMaxAmounts.TOKEN0.quotient.toString()
    }
    return undefined
  }, [isLpDynamicNativeSlippageEnabled, protocolVersion, currencyMaxAmounts])

  const useV2Endpoints = isCreatePositionV2

  const createCalldataQueryParams = useMemo(() => {
    return generateLiquidityServiceCreateCalldataQueryParams({
      address: smartPoolAddress ?? evmAddress,
      approvalCalldata,
      positionState,
      protocolVersion,
      creatingPoolOrPair,
      displayCurrencies: currencies.display,
      ticks,
      poolOrPair,
      currencyAmounts,
      independentField: depositState.exactField,
      slippageTolerance: nativeTokenBalance && !isSlippageDirty ? undefined : customSlippageTolerance,
      customDeadline,
      nativeTokenBalance,
      useV2Endpoints,
      poolId,
      isSmartPool: !!smartPoolAddress,
    })
  }, [
    evmAddress,
    smartPoolAddress,
    approvalCalldata,
    currencyAmounts,
    creatingPoolOrPair,
    ticks,
    poolOrPair,
    poolId,
    positionState,
    depositState.exactField,
    customSlippageTolerance,
    isSlippageDirty,
    currencies.display,
    protocolVersion,
    customDeadline,
    nativeTokenBalance,
    useV2Endpoints,
  ])

  const isUserCommittedToCreate =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommittedToCreate &&
    !inputError &&
    !transactionError &&
    !approvalLoading &&
    !approvalError &&
    !invalidRange &&
    // Either approval data is present, or no approval check was needed (smart pools skip it)
    (Boolean(approvalCalldata) || !addLiquidityApprovalParams) &&
    Boolean(createCalldataQueryParams)

  const { createCalldata, createError, createRefetch } = useCreatePositionQuery({
    createCalldataQueryParams,
    transactionError: !!transactionError,
    isQueryEnabled,
  })

  useEffect(() => {
    setRefetch(() => (approvalError ? approvalRefetch : createError ? createRefetch : undefined)) // this must set it as a function otherwise it will actually call createRefetch immediately
  }, [
    approvalError,
    createError,
    createCalldataQueryParams,
    addLiquidityApprovalParams,
    setTransactionError,
    setRefetch,
    createRefetch,
    approvalRefetch,
  ])

  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ approvalError, calldataError: createError }))
  }, [approvalError, createError])

  if (createError) {
    const message = parseErrorMessageTitle(createError, { defaultTitle: 'unknown CreateLpPositionCalldataQuery' })
    logger.error(message, {
      tags: { file: 'CreatePositionTxContext', function: 'useEffect' },
      extra: {
        canBatchTransactions,
        delegatedAddress,
      },
    })

    if (createCalldataQueryParams) {
      sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
        message,
        // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
        ...createCalldataQueryParams,
      })
    }
  }

  const dependentAmountFallback = useCreatePositionDependentAmountFallback({
    queryParams: createCalldataQueryParams,
    isQueryEnabled: isQueryEnabled && Boolean(createError),
    exactField: depositState.exactField,
  })

  const actualGasFee = createCalldata?.gasFee
  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    v4BatchPermitData: permitData,
    token0Cancel,
    token1Cancel,
    token0PermitTransaction,
    token1PermitTransaction,
  } = approvalCalldata ?? {}
  const needsApprovals = Boolean(
    permitData ||
    token0Approval ||
    token1Approval ||
    positionTokenApproval ||
    token0Cancel ||
    token1Cancel ||
    token0PermitTransaction ||
    token1PermitTransaction,
  )
  const { displayValue: calculatedGasFee } = useTransactionGasFee({
    tx: createCalldata?.create,
    skip: !!actualGasFee || needsApprovals,
  })
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(createCalldata?.create?.chainId) ?? undefined,
    actualGasFee || calculatedGasFee,
  )

  const lastKnownGasFeeRef = useRef<CurrencyAmount<Currency> | undefined>(undefined)
  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD]
    const currentFee = fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })

    // Keep the last known value if current is undefined
    if (currentFee) {
      lastKnownGasFeeRef.current = currentFee
    }

    return currentFee || lastKnownGasFeeRef.current
  }, [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD])

  const txInfo = useMemo(() => {
    return generateCreatePositionTxRequest({
      protocolVersion,
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams:
        createCalldataQueryParams instanceof CreateLPPositionRequest ||
        createCalldataQueryParams instanceof CreatePositionRequest
          ? createCalldataQueryParams
          : undefined,
      currencyAmounts,
      poolOrPair: protocolVersion === ProtocolVersion.V2 ? poolOrPair : undefined,
      canBatchTransactions,
      delegatedAddress,
      smartPoolAddress: smartPoolAddress ?? undefined,
      account,
    })
  }, [
    approvalCalldata,
    createCalldata,
    createCalldataQueryParams,
    currencyAmounts,
    poolOrPair,
    protocolVersion,
    canBatchTransactions,
    delegatedAddress,
    smartPoolAddress,
    account,
  ])

  useDynamicNativeSlippage({
    isEnabled: isLpDynamicNativeSlippageEnabled,
    nativeTokenBalance,
    createCalldata: createCalldata instanceof CreateLPPositionResponse ? createCalldata : undefined,
    isSlippageDirty,
  })

  const dependentAmount = useMemo(() => {
    if (createError && dependentAmountFallback) {
      return dependentAmountFallback
    }
    if (createCalldata instanceof CreateClassicPositionResponse) {
      return createCalldata.dependentToken?.amount
    }
    if (createCalldata instanceof CreatePositionResponse) {
      const dependentField =
        depositState.exactField === PositionField.TOKEN0 ? createCalldata.token1 : createCalldata.token0
      return dependentField?.amount
    }
    return createCalldata?.dependentAmount
  }, [createCalldata, createError, dependentAmountFallback, depositState.exactField])

  const value = useMemo(
    (): CreatePositionTxContextType => ({
      txInfo,
      gasFeeEstimateUSD: totalGasFee,
      transactionError,
      setTransactionError,
      dependentAmount,
      currencyAmounts,
      inputError,
      formattedAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
    }),
    [
      txInfo,
      totalGasFee,
      transactionError,
      dependentAmount,
      currencyAmounts,
      inputError,
      formattedAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
    ],
  )

  return <CreatePositionTxContext.Provider value={value}>{children}</CreatePositionTxContext.Provider>
}

export const useCreatePositionTxContext = (): CreatePositionTxContextType => {
  const context = useContext(CreatePositionTxContext)
  if (!context) {
    throw new Error('`useCreatePositionTxContext` must be used inside of `CreatePositionTxContextProvider`')
  }

  return context
}
