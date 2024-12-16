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
import { PositionField } from 'types/position'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSwapSettingsContext } from 'uniswap/src/features/transactions/swap/settings/contexts/SwapSettingsContext'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function CreatePositionContextProvider({
  children,
  initialState = {},
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
}) {
  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  useEffect(() => {
    // initial state may load in from the URL
    setPositionState((positionState) => ({ ...positionState, ...initialState }))
  }, [initialState])
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const derivedPositionInfo = useDerivedPositionInfo(positionState)
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData] = useState<DynamicFeeTierSpeedbumpData>({
    open: false,
    wishFeeData: DEFAULT_POSITION_STATE.fee,
  })
  const { defaultChainId } = useEnabledChains()

  const defaultInitialToken = nativeOnChain(defaultChainId)

  const reset = useCallback(() => {
    setPositionState({
      ...DEFAULT_POSITION_STATE,
      protocolVersion: positionState.protocolVersion,
      currencyInputs: { [PositionField.TOKEN0]: defaultInitialToken },
    })
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [defaultInitialToken, positionState.protocolVersion])

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
  const swapSettings = useSwapSettingsContext()

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
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const createCalldataQueryParams = useMemo(() => {
    return generateCreateCalldataQueryParams({
      account,
      approvalCalldata,
      positionState,
      derivedPositionInfo,
      priceRangeState,
      derivedPriceRangeInfo,
      derivedDepositInfo,
      swapSettings,
    })
  }, [
    account,
    approvalCalldata,
    derivedDepositInfo,
    derivedPositionInfo,
    derivedPriceRangeInfo,
    swapSettings,
    positionState,
    priceRangeState,
  ])
  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

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
  ])

  return <CreateTxContext.Provider value={validatedValue}>{children}</CreateTxContext.Provider>
}
