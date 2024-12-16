import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
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
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
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
  const { derivedPositionInfo } = useCreatePositionContext()
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>(DEFAULT_PRICE_RANGE_STATE)

  const reset = useCallback(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  }, [])

  useEffect(() => {
    // creatingPoolOrPair is calculated in the previous step of the create flow, so
    // it's safe to reset PriceRangeState to defaults when it changes.
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  }, [derivedPositionInfo.creatingPoolOrPair])

  useEffect(() => {
    // When the price is inverted, reset the state so that LiquidityChartRangeInput can redraw the default range if needed.
    setPriceRangeState((prevState) => {
      if (prevState.fullRange) {
        return { ...prevState, fullRange: true, minPrice: '', maxPrice: '' }
      } else {
        return { ...prevState, fullRange: false, minPrice: undefined, maxPrice: undefined }
      }
    })
  }, [priceRangeState.priceInverted])

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
  const { derivedPositionInfo, positionState } = useCreatePositionContext()
  const { derivedDepositInfo } = useDepositContext()
  const { priceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()
  const swapSettings = useTransactionSettingsContext()

  const hasError = Boolean(derivedDepositInfo.error)

  const addLiquidityApprovalParams = useMemo(() => {
    return generateAddLiquidityApprovalParams({
      account,
      positionState,
      derivedPositionInfo,
      derivedDepositInfo,
    })
  }, [account, derivedDepositInfo, derivedPositionInfo, positionState])
  const {
    data: approvalCalldata,
    error: approvalError,
    isLoading: approvalLoading,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    enabled: !hasError,
  })
  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[0]?.chainId,
    approvalCalldata?.gasFeeToken0Approval,
  )
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.currencies?.[1]?.chainId,
    approvalCalldata?.gasFeeToken1Approval,
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
    })
  }, [
    account,
    approvalCalldata,
    derivedDepositInfo,
    derivedPositionInfo,
    derivedPriceRangeInfo,
    positionState,
    priceRangeState,
  ])
  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    deadlineInMinutes: swapSettings.customDeadline,
    refetchInterval: 5 * ONE_SECOND_MS,
    enabled: !hasError && !approvalLoading && !approvalError && Boolean(approvalCalldata),
  })

  const actualGasFee = createCalldata?.gasFee
  const { value: calculatedGasFee } = useTransactionGasFee(createCalldata?.create, !!actualGasFee)
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    createCalldata?.create?.chainId,
    actualGasFee || calculatedGasFee,
  )

  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd])

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
      error: Boolean(approvalError || createError),
      refetch: approvalError ? approvalRefetch : createError ? createRefetch : undefined,
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
  ])

  return <CreateTxContext.Provider value={validatedValue}>{children}</CreateTxContext.Provider>
}
