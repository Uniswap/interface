import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { DepositState } from 'components/Liquidity/types'
import {
  CreatePositionContext,
  CreateTxContext,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE_CREATING_POOL,
  DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS,
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
import { useEffect, useMemo, useState } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
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

  return (
    <CreatePositionContext.Provider
      value={{
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
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>(DEFAULT_PRICE_RANGE_STATE_CREATING_POOL)

  useEffect(() => {
    // creatingPoolOrPair is calculated in the previous step of the create flow, so
    // it's safe to reset PriceRangeState to defaults when it changes.
    setPriceRangeState(
      derivedPositionInfo.creatingPoolOrPair
        ? DEFAULT_PRICE_RANGE_STATE_CREATING_POOL
        : DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS,
    )
  }, [derivedPositionInfo.creatingPoolOrPair])

  useEffect(() => {
    // When the price is inverted, reset the state so that LiquidityChartRangeInput redraws the default range.
    setPriceRangeState((prevState) => ({ ...prevState, fullRange: false, minPrice: undefined, maxPrice: undefined }))
  }, [priceRangeState.priceInverted])

  const derivedPriceRangeInfo = useDerivedPriceRangeInfo(priceRangeState)

  return (
    <PriceRangeContext.Provider value={{ priceRangeState, setPriceRangeState, derivedPriceRangeInfo }}>
      {children}
    </PriceRangeContext.Provider>
  )
}

export function DepositContextProvider({ children }: { children: React.ReactNode }) {
  const [depositState, setDepositState] = useState<DepositState>(DEFAULT_DEPOSIT_STATE)
  const derivedDepositInfo = useDerivedDepositInfo(depositState)

  return (
    <DepositContext.Provider value={{ depositState, setDepositState, derivedDepositInfo }}>
      {children}
    </DepositContext.Provider>
  )
}

export function CreateTxContextProvider({ children }: { children: React.ReactNode }) {
  const account = useAccountMeta()
  const { derivedPositionInfo, positionState } = useCreatePositionContext()
  const { derivedDepositInfo } = useDepositContext()
  const { priceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()

  const addLiquidityApprovalParams = useMemo(() => {
    return generateAddLiquidityApprovalParams({
      account,
      positionState,
      derivedPositionInfo,
      derivedDepositInfo,
    })
  }, [account, derivedDepositInfo, derivedPositionInfo, positionState])
  const { data: approvalCalldata } = useCheckLpApprovalQuery({
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
  const { data: createCalldata } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const validatedValue = useMemo(() => {
    return generateCreatePositionTxRequest({
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams,
      derivedPositionInfo,
      derivedDepositInfo,
    })
  }, [approvalCalldata, createCalldata, createCalldataQueryParams, derivedPositionInfo, derivedDepositInfo])

  return <CreateTxContext.Provider value={validatedValue}>{children}</CreateTxContext.Provider>
}
