import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useDerivedPositionInfo } from 'components/Liquidity/Create/hooks/useDerivedPositionInfo'
import {
  PositionFlowStep,
  type DynamicFeeTierSpeedbumpData,
  type PositionState,
  type PriceRangeState,
} from 'components/Liquidity/Create/types'
import type { DepositState } from 'components/Liquidity/types'
import { getPriceRangeInfo } from 'components/Liquidity/utils/priceRangeInfo'
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PositionField } from 'types/position'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useEvent } from 'utilities/src/react/hooks'

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '',
  maxPrice: '',
  initialPrice: '',
}

export const DEFAULT_DEPOSIT_STATE: DepositState = {
  exactField: PositionField.TOKEN0,
  exactAmounts: {},
}

const DEFAULT_FEE_DATA = {
  feeAmount: FeeAmount.MEDIUM,
  tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
  isDynamic: false,
}

const DEFAULT_POSITION_STATE: PositionState = {
  fee: DEFAULT_FEE_DATA,
  hook: undefined,
  userApprovedHook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

// Combined state interface
interface BaseCreateLiquidityState {
  protocolVersion: ProtocolVersion
  creatingPoolOrPair?: boolean
  poolId?: string
  poolOrPairLoading?: boolean
  poolOrPair: V4Pool | V3Pool | Pair | undefined
  price: Price<Currency, Currency> | undefined
  ticks: [Maybe<number>, Maybe<number>]
  pricesAtTicks: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>]
  ticksAtLimit: [boolean, boolean]

  // From CreatePositionContext
  areTokensUnchanged: boolean
  positionState: PositionState
  step: PositionFlowStep
  currentTransactionStep?: { step: TransactionStep; accepted: boolean }
  feeTierSearchModalOpen: boolean
  dynamicFeeTierSpeedbumpData: DynamicFeeTierSpeedbumpData

  // From PriceRangeContext
  priceRangeState: PriceRangeState

  // From DepositContext
  depositState: DepositState
}

interface CreateV2LiquidityState extends BaseCreateLiquidityState {
  protocolVersion: ProtocolVersion.V2
  poolOrPair: Pair | undefined
  currencies: {
    // sorted
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Token> } // wrapped
  }
}

interface CreateV3LiquidityState extends BaseCreateLiquidityState {
  protocolVersion: ProtocolVersion.V3
  poolOrPair: V3Pool | undefined
  currencies: {
    // sorted
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Token> } // wrapped
  }
}

interface CreateV4LiquidityState extends BaseCreateLiquidityState {
  protocolVersion: ProtocolVersion.V4
  poolOrPair: V4Pool | undefined
  currencies: {
    // sorted and both of these are equal for v4
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Currency> }
  }
}

type CreateLiquidityState = CreateV2LiquidityState | CreateV3LiquidityState | CreateV4LiquidityState

// Combined context value interface
type CreateLiquidityContextType = CreateLiquidityState & {
  // Setters
  setPositionState: React.Dispatch<React.SetStateAction<PositionState>>
  setCurrencyInputs: React.Dispatch<React.SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  setStep: React.Dispatch<React.SetStateAction<PositionFlowStep>>
  setCurrentTransactionStep: React.Dispatch<
    React.SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>
  >
  setFeeTierSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setDynamicFeeTierSpeedbumpData: React.Dispatch<React.SetStateAction<DynamicFeeTierSpeedbumpData>>
  setPriceRangeState: React.Dispatch<React.SetStateAction<PriceRangeState>>
  setDepositState: React.Dispatch<React.SetStateAction<DepositState>>
  setError: React.Dispatch<React.SetStateAction<string | boolean>>
  setRefetch: React.Dispatch<React.SetStateAction<(() => void) | undefined>>

  // Transaction info
  error: string | boolean
  refetch?: () => void
  refetchPoolData: () => void

  // Reset functions
  reset: () => void
  resetPriceRange: () => void
  resetDeposit: () => void
}

const CreateLiquidityContext = createContext<CreateLiquidityContextType | undefined>(undefined)

export function CreateLiquidityContextProvider({
  children,
  initialState = {},
  currencyInputs,
  setCurrencyInputs,
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  // Combined state from all 4 providers
  const initialCurrencyInputs = useRef(currencyInputs).current

  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData] = useState<DynamicFeeTierSpeedbumpData>({
    open: false,
    wishFeeData: DEFAULT_POSITION_STATE.fee,
  })
  const [error, setError] = useState<string | boolean>(false)
  const [refetch, setRefetch] = useState<() => void>()

  // Price range state
  const initialPosition = positionState.initialPosition
  const fullRange = initialPosition?.isOutOfRange ? false : true
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })

  // Deposit state
  const [depositState, setDepositState] = useState<DepositState>(DEFAULT_DEPOSIT_STATE)

  // Derived info
  const derivedPositionInfo = useDerivedPositionInfo(currencyInputs, positionState)
  const derivedPriceRangeInfo = useMemo(() => {
    return getPriceRangeInfo({ derivedPositionInfo, state: priceRangeState, positionState })
  }, [derivedPositionInfo, priceRangeState, positionState])

  const poolOrPair = useMemo(() => {
    if (
      derivedPositionInfo.protocolVersion === ProtocolVersion.V2 &&
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2
    ) {
      return derivedPositionInfo.pair ?? derivedPriceRangeInfo.mockPair
    }

    if (
      derivedPositionInfo.protocolVersion === ProtocolVersion.V3 &&
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V3
    ) {
      return derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
    }

    if (
      derivedPositionInfo.protocolVersion === ProtocolVersion.V4 &&
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V4
    ) {
      return derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
    }

    return undefined
  }, [derivedPositionInfo, derivedPriceRangeInfo])

  // Reset functions
  const reset = useEvent(() => {
    setPositionState({ ...DEFAULT_POSITION_STATE, ...initialState })
    setCurrencyInputs(initialCurrencyInputs)
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  })

  const resetPriceRange = useEvent(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  })

  const resetDeposit = useEvent(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
  })

  useEffect(() => {
    setPriceRangeState({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })
  }, [fullRange])

  useEffect(() => {
    setPriceRangeState((prevState) => {
      if (prevState.fullRange) {
        return { ...prevState, fullRange, minPrice: '', maxPrice: '' }
      } else {
        return { ...prevState, fullRange: false, minPrice: undefined, maxPrice: undefined }
      }
    })
  }, [priceRangeState.priceInverted, fullRange])

  const protocolSpecificValues = useMemo(() => {
    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
      return {
        protocolVersion: ProtocolVersion.V2 as const,
        poolOrPair: poolOrPair as Pair,
        currencies: derivedPositionInfo.currencies,
      }
    }

    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V3) {
      return {
        protocolVersion: ProtocolVersion.V3 as const,
        poolOrPair: poolOrPair as V3Pool,
        currencies: derivedPositionInfo.currencies,
      }
    }

    return {
      protocolVersion: ProtocolVersion.V4 as const,
      poolOrPair: poolOrPair as V4Pool,
      currencies: derivedPositionInfo.currencies,
    }
  }, [derivedPositionInfo.protocolVersion, poolOrPair, derivedPositionInfo.currencies])

  const value: CreateLiquidityContextType = {
    // State
    ...protocolSpecificValues,
    poolId: derivedPositionInfo.poolId,
    poolOrPairLoading: derivedPositionInfo.poolOrPairLoading,
    creatingPoolOrPair: derivedPositionInfo.creatingPoolOrPair,
    price: derivedPriceRangeInfo.price,
    ticks:
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2
        ? [undefined, undefined]
        : derivedPriceRangeInfo.ticks,
    ticksAtLimit:
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2
        ? [false, false]
        : derivedPriceRangeInfo.ticksAtLimit,
    pricesAtTicks:
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2
        ? [undefined, undefined]
        : derivedPriceRangeInfo.pricesAtTicks,
    areTokensUnchanged: currencyInputs.tokenA === initialCurrencyInputs.tokenA && !currencyInputs.tokenB,
    positionState,
    step,
    currentTransactionStep,
    feeTierSearchModalOpen,
    dynamicFeeTierSpeedbumpData,
    priceRangeState,
    depositState,
    // Transaction info
    error,
    refetch,
    // Setters
    setPositionState,
    setStep,
    setCurrentTransactionStep,
    setFeeTierSearchModalOpen,
    setDynamicFeeTierSpeedbumpData,
    setPriceRangeState,
    setDepositState,
    setCurrencyInputs,
    setError,
    setRefetch,
    refetchPoolData: derivedPositionInfo.refetchPoolData,
    // Reset functions
    reset,
    resetPriceRange,
    resetDeposit,
  }

  return <CreateLiquidityContext.Provider value={value}>{children}</CreateLiquidityContext.Provider>
}

export function useCreateLiquidityContext(): CreateLiquidityContextType {
  const context = useContext(CreateLiquidityContext)
  if (!context) {
    throw new Error('useCreateLiquidityContext must be used within a CreateLiquidityContextProvider')
  }
  return context
}
