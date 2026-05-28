import { Currency } from '@uniswap/sdk-core'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState } from 'react'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useDerivedIncreaseLiquidityInfo } from '~/pages/IncreaseLiquidity/hooks/useDerivedIncreaseLiquidityInfo'
import { usePreEstimatedIncreaseLiquidityGas } from '~/pages/IncreaseLiquidity/hooks/usePreEstimatedIncreaseLiquidityGas'
import { LiquidityModalInitialState } from '~/state/application/reducer'
import { DepositInfo } from '~/types/liquidity'
import { PositionField } from '~/types/position'

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
  currencies?: { [key in PositionField]: Currency }
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
  preEstimatedGasFee?: string
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
  preEstimatedGasFee: undefined,
})

export function useIncreaseLiquidityContext() {
  return useContext(IncreaseLiquidityContext)
}

export function IncreaseLiquidityContextProvider({ children }: PropsWithChildren) {
  const positionInfo = useModalInitialState(ModalName.AddLiquidity)

  const [step, setStep] = useState(IncreaseLiquidityStep.Input)
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)
  const [increaseLiquidityState, setIncreaseLiquidityState] = useState<IncreaseLiquidityState>({
    ...DEFAULT_INCREASE_LIQUIDITY_STATE,
    position: positionInfo,
  })
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()

  const accountAddress = useActiveAddress(Platform.EVM)
  const { gasFee: preEstimatedGasFee } = usePreEstimatedIncreaseLiquidityGas({ positionInfo, accountAddress })

  const derivedIncreaseLiquidityInfo = useDerivedIncreaseLiquidityInfo({
    state: increaseLiquidityState,
    unwrapNativeCurrency,
    actualGasFee: preEstimatedGasFee,
  })

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
      preEstimatedGasFee,
    }),
    [
      increaseLiquidityState,
      derivedIncreaseLiquidityInfo,
      step,
      unwrapNativeCurrency,
      currentTransactionStep,
      preEstimatedGasFee,
    ],
  )

  return <IncreaseLiquidityContext.Provider value={value}>{children}</IncreaseLiquidityContext.Provider>
}
