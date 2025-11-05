import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useDerivedPositionInfo } from 'components/Liquidity/Create/hooks/useDerivedPositionInfo'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import {
  type DynamicFeeTierSpeedbumpData,
  PositionFlowStep,
  type PositionState,
  type PriceRangeState,
  RangeAmountInputPriceMode,
} from 'components/Liquidity/Create/types'
import type { DepositState } from 'components/Liquidity/types'
import { getPriceRangeInfo } from 'components/Liquidity/utils/priceRangeInfo'
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useEvent } from 'utilities/src/react/hooks'

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: false,
  minPrice: '',
  maxPrice: '',
  initialPrice: '',
  inputMode: RangeAmountInputPriceMode.PRICE,
}

export const DEFAULT_DEPOSIT_STATE: DepositState = {
  exactField: PositionField.TOKEN0,
  exactAmounts: {},
}

const DEFAULT_POSITION_STATE: PositionState = {
  fee: undefined,
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
  isNativeTokenAOnly: boolean
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
  setStep: (step: PositionFlowStep | null) => void
  setCurrentTransactionStep: React.Dispatch<
    React.SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>
  >
  setFeeTierSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setDynamicFeeTierSpeedbumpData: React.Dispatch<React.SetStateAction<DynamicFeeTierSpeedbumpData>>
  setPriceRangeState: React.Dispatch<React.SetStateAction<PriceRangeState>>
  setDepositState: React.Dispatch<React.SetStateAction<DepositState>>
  setRefetch: React.Dispatch<React.SetStateAction<(() => void) | undefined>>

  // Transaction info
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
  currencyInputs,
  setCurrencyInputs,
  defaultInitialToken,
  initialPositionState,
  initialPriceRangeState,
  initialDepositState,
  initialFlowStep,
}: {
  children: React.ReactNode
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  defaultInitialToken?: Maybe<Currency>
  initialPositionState?: Partial<PositionState>
  initialPriceRangeState?: Partial<PriceRangeState>
  initialDepositState?: Partial<DepositState>
  initialFlowStep: PositionFlowStep
}) {
  const isD3LiquidityRangeChartEnabled = useFeatureFlag(FeatureFlags.D3LiquidityRangeChart)
  const [positionState, setPositionState] = useState<PositionState>(() => ({
    ...DEFAULT_POSITION_STATE,
    ...initialPositionState,
  }))
  // Use URL step as source of truth (always defined now with default)
  const step = initialFlowStep
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()

  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData] = useState<DynamicFeeTierSpeedbumpData>({
    open: false,
    wishFeeData: undefined,
  })
  const [refetch, setRefetch] = useState<() => void>()

  // Initialize price range state
  const initialPosition = positionState.initialPosition
  const defaultFullRange = initialPosition?.isOutOfRange ? false : !isD3LiquidityRangeChartEnabled
  const urlFullRange = initialPriceRangeState?.fullRange
  const initialFullRange = urlFullRange !== undefined ? urlFullRange : defaultFullRange
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>(() => ({
    ...DEFAULT_PRICE_RANGE_STATE,
    fullRange: initialFullRange,
    ...initialPriceRangeState,
  }))

  // Initialize deposit state
  const [depositState, setDepositState] = useState<DepositState>({
    ...DEFAULT_DEPOSIT_STATE,
    ...initialDepositState,
  })

  // Derived info
  const derivedPositionInfo = useDerivedPositionInfo(currencyInputs, positionState)

  // Get URL sync function from consolidated hook
  const { setHistoryState, syncToUrl } = useLiquidityUrlState()

  // Single sync effect with batched updates
  useEffect(() => {
    syncToUrl({
      currencyInputs,
      positionState,
      priceRangeState,
      depositState,
    })
  }, [currencyInputs, positionState, priceRangeState, depositState, syncToUrl])

  // Derived price range info
  const derivedPriceRangeInfo = useMemo(() => {
    return getPriceRangeInfo({ derivedPositionInfo, state: priceRangeState, positionState })
  }, [derivedPositionInfo, priceRangeState, positionState])

  const poolOrPair = useMemo(() => {
    if (!derivedPriceRangeInfo) {
      return undefined
    }

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
    setPositionState({
      ...DEFAULT_POSITION_STATE,
      protocolVersion: positionState.protocolVersion,
    })
    setCurrencyInputs({
      tokenA: defaultInitialToken,
      tokenB: undefined,
    })
    setHistoryState(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  })

  const resetPriceRange = useEvent(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  })

  const resetDeposit = useEvent(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
  })

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

  const isNativeTokenAOnly = Boolean(currencyInputs.tokenA?.isNative && !currencyInputs.tokenB)

  const value: CreateLiquidityContextType = {
    // State
    ...protocolSpecificValues,
    poolId: derivedPositionInfo.poolId,
    poolOrPairLoading: derivedPositionInfo.poolOrPairLoading,
    creatingPoolOrPair: derivedPositionInfo.creatingPoolOrPair,
    price: derivedPriceRangeInfo?.price,
    ticks:
      derivedPriceRangeInfo?.protocolVersion === ProtocolVersion.V2 || !derivedPriceRangeInfo
        ? [undefined, undefined]
        : derivedPriceRangeInfo.ticks,
    ticksAtLimit:
      derivedPriceRangeInfo?.protocolVersion === ProtocolVersion.V2 || !derivedPriceRangeInfo
        ? [false, false]
        : derivedPriceRangeInfo.ticksAtLimit,
    pricesAtTicks:
      derivedPriceRangeInfo?.protocolVersion === ProtocolVersion.V2 || !derivedPriceRangeInfo
        ? [undefined, undefined]
        : derivedPriceRangeInfo.pricesAtTicks,
    isNativeTokenAOnly,
    positionState,
    step,
    currentTransactionStep,
    feeTierSearchModalOpen,
    dynamicFeeTierSpeedbumpData,
    priceRangeState,
    depositState,
    // Transaction info
    refetch,
    // Setters
    setPositionState,
    setStep: setHistoryState,
    setCurrentTransactionStep,
    setFeeTierSearchModalOpen,
    setDynamicFeeTierSpeedbumpData,
    setPriceRangeState,
    setDepositState,
    setCurrencyInputs,
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
