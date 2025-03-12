import { useDerivedIncreaseLiquidityInfo } from 'components/IncreaseLiquidity/hooks'
import { useModalLiquidityInitialState } from 'components/Liquidity/hooks'
import { DepositInfo } from 'components/Liquidity/types'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { LiquidityModalInitialState } from 'state/application/reducer'
import { PositionField } from 'types/position'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'

export enum IncreaseLiquidityStep {
  Input = 0,
  Review = 1,
}

export interface IncreaseLiquidityState {
  position?: LiquidityModalInitialState
  exactField: PositionField
  exactAmount?: string
}
const DEFAULT_INCREASE_LIQUIDITY_STATE = {
  step: IncreaseLiquidityStep.Input,
  exactField: PositionField.TOKEN0,
}

// This increase-specific context needs to recalculate deposit0Disabled and deposit1Disabled,
// which are derived from price range inputs in the regular create flow.
export type IncreaseLiquidityDerivedInfo = DepositInfo & {
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
}

interface IncreaseLiquidityContextType {
  step: IncreaseLiquidityStep
  setStep: Dispatch<SetStateAction<IncreaseLiquidityStep>>
  increaseLiquidityState: IncreaseLiquidityState
  derivedIncreaseLiquidityInfo: IncreaseLiquidityDerivedInfo
  setIncreaseLiquidityState: Dispatch<SetStateAction<IncreaseLiquidityState>>
  unwrapNativeCurrency: boolean
  setUnwrapNativeCurrency: Dispatch<SetStateAction<boolean>>
  currentTransactionStep?: { step: TransactionStep; accepted: boolean }
  setCurrentTransactionStep: Dispatch<SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>>
}

const IncreaseLiquidityContext = createContext<IncreaseLiquidityContextType>({
  step: IncreaseLiquidityStep.Input,
  setStep: () => undefined,
  increaseLiquidityState: DEFAULT_INCREASE_LIQUIDITY_STATE,
  derivedIncreaseLiquidityInfo: {},
  setIncreaseLiquidityState: () => undefined,
  unwrapNativeCurrency: true,
  setUnwrapNativeCurrency: () => undefined,
  currentTransactionStep: undefined,
  setCurrentTransactionStep: () => undefined,
})

export function useIncreaseLiquidityContext() {
  return useContext(IncreaseLiquidityContext)
}

export function IncreaseLiquidityContextProvider({ children }: PropsWithChildren) {
  const positionInfo = useModalLiquidityInitialState()

  const [step, setStep] = useState(IncreaseLiquidityStep.Input)
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)
  const [increaseLiquidityState, setIncreaseLiquidityState] = useState<IncreaseLiquidityState>({
    ...DEFAULT_INCREASE_LIQUIDITY_STATE,
    position: positionInfo,
  })
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()

  const derivedIncreaseLiquidityInfo = useDerivedIncreaseLiquidityInfo(increaseLiquidityState, unwrapNativeCurrency)

  const value = useMemo(
    () => ({
      step,
      setStep,
      increaseLiquidityState,
      setIncreaseLiquidityState,
      derivedIncreaseLiquidityInfo,
      unwrapNativeCurrency,
      setUnwrapNativeCurrency,
      currentTransactionStep,
      setCurrentTransactionStep,
    }),
    [increaseLiquidityState, derivedIncreaseLiquidityInfo, step, unwrapNativeCurrency, currentTransactionStep],
  )

  return <IncreaseLiquidityContext.Provider value={value}>{children}</IncreaseLiquidityContext.Provider>
}
