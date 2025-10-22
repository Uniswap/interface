import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { getCurrencyWithOptionalUnwrap } from 'components/Liquidity/utils/currency'
import { useModalInitialState } from 'hooks/useModalInitialState'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState } from 'react'
import { LiquidityModalInitialState } from 'state/application/reducer'
import { PositionField } from 'types/position'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'

export enum DecreaseLiquidityStep {
  Input = 0,
  Review = 1,
}

type RemoveLiquidityModalState = {
  step: DecreaseLiquidityStep
  setStep: Dispatch<SetStateAction<DecreaseLiquidityStep>>
  percent: string
  setPercent: (percent: string) => void
  positionInfo?: LiquidityModalInitialState
  currencies?: { [key in PositionField]: Currency }
  percentInvalid?: boolean
  unwrapNativeCurrency: boolean
  setUnwrapNativeCurrency: Dispatch<SetStateAction<boolean>>
  currentTransactionStep?: { step: TransactionStep; accepted: boolean }
  setCurrentTransactionStep: Dispatch<SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>>
}

const RemoveLiquidityModalContext = createContext<RemoveLiquidityModalState>({
  step: DecreaseLiquidityStep.Input,
  setStep: () => null,
  percent: '',
  setPercent: () => null,
  percentInvalid: true,
  unwrapNativeCurrency: true,
  setUnwrapNativeCurrency: () => null,
  currentTransactionStep: undefined,
  setCurrentTransactionStep: () => null,
})

export function RemoveLiquidityModalContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [step, setStep] = useState(DecreaseLiquidityStep.Input)
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)
  const [percent, setPercent] = useState<string>('')
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const positionInfo = useModalInitialState(ModalName.RemoveLiquidity)

  const percentInvalid = percent === '0' || percent === '' || !percent
  const currencies = useMemo(() => {
    const currency0 = getCurrencyWithOptionalUnwrap({
      currency: positionInfo?.currency0Amount.currency,
      shouldUnwrap: unwrapNativeCurrency && positionInfo?.version !== ProtocolVersion.V4,
    })
    const currency1 = getCurrencyWithOptionalUnwrap({
      currency: positionInfo?.currency1Amount.currency,
      shouldUnwrap: unwrapNativeCurrency && positionInfo?.version !== ProtocolVersion.V4,
    })

    if (!currency0 || !currency1) {
      return undefined
    }

    return {
      TOKEN0: currency0,
      TOKEN1: currency1,
    }
  }, [
    positionInfo?.version,
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
    unwrapNativeCurrency,
  ])

  const ctx = useMemo(
    () => ({
      percent,
      setPercent,
      step,
      setStep,
      positionInfo,
      currencies,
      percentInvalid,
      unwrapNativeCurrency,
      setUnwrapNativeCurrency,
      currentTransactionStep,
      setCurrentTransactionStep,
    }),
    [percent, step, positionInfo, currencies, percentInvalid, unwrapNativeCurrency, currentTransactionStep],
  )

  return <RemoveLiquidityModalContext.Provider value={ctx}>{children}</RemoveLiquidityModalContext.Provider>
}

export function useRemoveLiquidityModalContext() {
  const removeModalContext = useContext(RemoveLiquidityModalContext)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (removeModalContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeModalContext
}
