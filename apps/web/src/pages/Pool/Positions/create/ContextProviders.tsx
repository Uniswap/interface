import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { useCreatePositionDependentAmountFallback } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { DepositState } from 'components/Liquidity/types'
import {
  CreatePositionContext,
  CreateTxContext,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  DepositContext,
  PriceRangeContext,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { DynamicFeeTierSpeedbump } from 'pages/Pool/Positions/create/DynamicFeeTierSpeedbump'
import {
  useDerivedDepositInfo,
  useDerivedPositionInfo,
  useDerivedPriceRangeInfo,
} from 'pages/Pool/Positions/create/hooks'
import {
  DEFAULT_POSITION_STATE,
  DynamicFeeTierSpeedbumpData,
  PositionFlowStep,
  PositionState,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  generateAddLiquidityApprovalParams,
  generateCreateCalldataQueryParams,
  generateCreatePositionTxRequest,
} from 'pages/Pool/Positions/create/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function CreatePositionContextProvider({
  children,
  initialState = {},
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
}) {
  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const derivedPositionInfo = useDerivedPositionInfo(positionState)
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData] = useState<DynamicFeeTierSpeedbumpData>({
    open: false,
    wishFeeData: DEFAULT_POSITION_STATE.fee,
  })

  const reset = useCallback(() => {
    setPositionState({
      ...DEFAULT_POSITION_STATE,
      ...initialState,
    })
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [initialState])

  // initialState.currencyInputs can change because it relies on async data to populate token0 and token1
  useEffect(() => {
    if (initialState.currencyInputs) {
      setPositionState((prevState) => ({
        ...prevState,
        currencyInputs: { ...prevState.currencyInputs, ...initialState.currencyInputs },
      }))
    }
  }, [initialState.currencyInputs])

  return (
    <CreatePositionContext.Provider
      value={{
        reset,
        step,
        setStep,
        positionState,
        setPositionState,
        derivedPositionInfo,
        feeTierSearchModalOpen,
        currentTransactionStep,
        setCurrentTransactionStep,
        setFeeTierSearchModalOpen,
        dynamicFeeTierSpeedbumpData,
        setDynamicFeeTierSpeedbumpData,
      }}
    >
      {children}
      <FeeTierSearchModal />
      <DynamicFeeTierSpeedbump />
    </CreatePositionContext.Provider>
  )
}

export function PriceRangeContextProvider({ children }: { children: React.ReactNode }) {
  const { positionState } = useCreatePositionContext()
  const initialPosition = positionState.initialPosition
  const fullRange = initialPosition?.isOutOfRange ? false : true
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })

  const reset = useCallback(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  }, [])

  useEffect(() => {
    // creatingPoolOrPair is calculated in the previous step of the create flow, so
    // it's safe to reset PriceRangeState to defaults when it changes.
    setPriceRangeState({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })
  }, [fullRange])

  useEffect(() => {
    // When the price is inverted, reset the state so that LiquidityChartRangeInput can redraw the default range if needed.
    setPriceRangeState((prevState) => {
      if (prevState.fullRange) {
        return { ...prevState, fullRange, minPrice: '', maxPrice: '' }
      } else {
        return { ...prevState, fullRange: false, minPrice: undefined, maxPrice: undefined }
      }
    })
  }, [priceRangeState.priceInverted, fullRange])

  const derivedPriceRangeInfo = useDerivedPriceRangeInfo(priceRangeState)

  return (
    <PriceRangeContext.Provider value={{ reset, priceRangeState, setPriceRangeState, derivedPriceRangeInfo }}>
      {children}
    </PriceRangeContext.Provider>
  )
}

export function DepositContextProvider({ children }: { children: React.ReactNode }) {
  const [depositState, setDepositState] = useState<DepositState>(DEFAULT_DEPOSIT_STATE)
  const derivedDepositInfo = useDerivedDepositInfo(depositState)

  const { derivedPriceRangeInfo } = usePriceRangeContext()
  useEffect(() => {
    if (derivedPriceRangeInfo.deposit1Disabled) {
      setDepositState((prev) => ({ ...prev, exactField: PositionField.TOKEN0 }))
    } else if (derivedPriceRangeInfo.deposit0Disabled) {
      setDepositState((prev) => ({ ...prev, exactField: PositionField.TOKEN1 }))
    }
  }, [derivedPriceRangeInfo?.deposit0Disabled, derivedPriceRangeInfo?.deposit1Disabled])

  const reset = useCallback(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
  }, [])

  return (
    <DepositContext.Provider value={{ reset, depositState, setDepositState, derivedDepositInfo }}>
      {children}
    </DepositContext.Provider>
  )
}

export function CreateTxContextProvider({ children }: { children: React.ReactNode }) {
  const account = useAccountMeta()
  const { derivedPositionInfo, positionState, currentTransactionStep } = useCreatePositionContext()
  const { derivedDepositInfo, depositState } = useDepositContext()
  const { priceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsContext()

  const generatePermitAsTransaction = useUniswapContext().getCanSignPermits?.(
    derivedPositionInfo.currencies[0]?.chainId,
  )

  const hasError = Boolean(derivedDepositInfo.error)
  const [hasCreateErrorResponse, setHasCreateErrorResponse] = useState(false)

  const invalidRange =
    derivedPriceRangeInfo.protocolVersion !== ProtocolVersion.V2 && derivedPriceRangeInfo.invalidRange

  const addLiquidityApprovalParams = useMemo(() => {
    return generateAddLiquidityApprovalParams({
      account,
      positionState,
      derivedPositionInfo,
      derivedDepositInfo,
      generatePermitAsTransaction,
    })
  }, [account, derivedDepositInfo, derivedPositionInfo, positionState, generatePermitAsTransaction])
  const {
    data: approvalCalldata,
    error: approvalError,
    isLoading: approvalLoading,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    retry: false,
    enabled: !!addLiquidityApprovalParams && !hasError && !hasCreateErrorResponse && !invalidRange,
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })

    logger.error(message, {
      tags: {
        file: 'CreateTxContextProvider',
        function: 'useEffect',
      },
    })
  }

  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[0]?.chainId,
    approvalCalldata?.gasFeeToken0Approval,
  )
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[1]?.chainId,
    approvalCalldata?.gasFeeToken1Approval,
  )
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[0]?.chainId,
    approvalCalldata?.gasFeeToken0Permit,
  )
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[1]?.chainId,
    approvalCalldata?.gasFeeToken1Permit,
  )

  const createCalldataQueryParams = useMemo(() => {
    return generateCreateCalldataQueryParams({
      account,
      approvalCalldata,
      positionState,
      derivedPositionInfo,
      priceRangeState,
      derivedPriceRangeInfo,
      derivedDepositInfo,
      independentField: depositState.exactField,
      slippageTolerance: customSlippageTolerance,
    })
  }, [
    account,
    approvalCalldata,
    derivedDepositInfo,
    derivedPositionInfo,
    derivedPriceRangeInfo,
    positionState,
    priceRangeState,
    depositState.exactField,
    customSlippageTolerance,
  ])

  const isUserCommittedToCreate =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommittedToCreate &&
    !hasError &&
    !approvalLoading &&
    !approvalError &&
    !invalidRange &&
    Boolean(approvalCalldata) &&
    Boolean(createCalldataQueryParams)

  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: hasCreateErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  useEffect(() => {
    setHasCreateErrorResponse(!!createError)
  }, [createError, createCalldataQueryParams, addLiquidityApprovalParams])

  if (createError) {
    const message = parseErrorMessageTitle(createError, { defaultTitle: 'unknown CreateLpPositionCalldataQuery' })

    logger.error(message, {
      tags: {
        file: 'CreateTxContextProvider',
        function: 'useEffect',
      },
    })

    if (createCalldataQueryParams) {
      sendAnalyticsEvent(InterfaceEventNameLocal.CreatePositionFailed, {
        message,
        ...createCalldataQueryParams,
      })
    }
  }

  const dependentAmountFallback = useCreatePositionDependentAmountFallback(
    createCalldataQueryParams,
    isQueryEnabled && Boolean(createError),
  )

  const actualGasFee = createCalldata?.gasFee
  const needsApprovals = !!(
    approvalCalldata?.token0Approval ||
    approvalCalldata?.token1Approval ||
    approvalCalldata?.token0Cancel ||
    approvalCalldata?.token1Cancel ||
    approvalCalldata?.token0PermitTransaction ||
    approvalCalldata?.token1PermitTransaction
  )
  const { value: calculatedGasFee } = useTransactionGasFee(
    createCalldata?.create,
    !!actualGasFee || needsApprovals /* skip */,
  )
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(createCalldata?.create?.chainId) ?? undefined,
    actualGasFee || calculatedGasFee,
  )

  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD])

  const validatedValue = useMemo(() => {
    const txInfo = generateCreatePositionTxRequest({
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams,
      derivedPositionInfo,
      derivedDepositInfo,
    })

    return {
      txInfo,
      gasFeeEstimateUSD: totalGasFee,
      error: getErrorMessageToDisplay({ approvalError, calldataError: createError }),
      refetch: approvalError ? approvalRefetch : createError ? createRefetch : undefined,
      // in some cases there is an error with create but createCalldata still has a cached value
      dependentAmount:
        createError && dependentAmountFallback ? dependentAmountFallback : createCalldata?.dependentAmount,
    }
  }, [
    approvalCalldata,
    createCalldata,
    createCalldataQueryParams,
    derivedPositionInfo,
    derivedDepositInfo,
    approvalError,
    createError,
    approvalRefetch,
    createRefetch,
    totalGasFee,
    dependentAmountFallback,
  ])

  return <CreateTxContext.Provider value={validatedValue}>{children}</CreateTxContext.Provider>
}
