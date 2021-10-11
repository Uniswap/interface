import { useAtom } from 'jotai'
import { useContext } from 'react'

import { StoreAtomContext } from '.'
import {
  resetSettings,
  setExpertMode,
  setGasPrice,
  setMaxSlippage,
  setMultihop,
  setTransactionDeadline,
  toggleShowDetails,
} from './actions'
import { GasPrice, MaxSlippage } from './reducer'

export function useSwapStore() {
  return useAtom(useContext(StoreAtomContext))
}

export function useShowDetails(): [boolean, () => void] {
  const [{ showDetails }, dispatch] = useSwapStore()
  return [showDetails, () => dispatch(toggleShowDetails())]
}

export function useResetSettings() {
  const [, dispatch] = useSwapStore()
  return () => dispatch(resetSettings())
}

export function useGasPrice(): [[GasPrice, number | undefined], (value: GasPrice, custom?: number) => void] {
  const [{ gasPrice, customGasPrice }, dispatch] = useSwapStore()
  return [
    [gasPrice, customGasPrice],
    (gasPrice: GasPrice, customGasPrice?: number) => dispatch(setGasPrice({ gasPrice, customGasPrice })),
  ]
}

export function useMaxSlippage(): [[MaxSlippage, number | undefined], (value: MaxSlippage, custom?: number) => void] {
  const [{ maxSlippage, customMaxSlippage }, dispatch] = useSwapStore()
  return [
    [maxSlippage, customMaxSlippage],
    (maxSlippage: MaxSlippage, customMaxSlippage?: number) =>
      dispatch(setMaxSlippage({ maxSlippage, customMaxSlippage })),
  ]
}

export function useTransactionDeadline(): [number, (value: number) => void] {
  const [{ transactionDeadline }, dispatch] = useSwapStore()
  return [transactionDeadline, (value: number) => dispatch(setTransactionDeadline(value))]
}

export function useExpertMode(): [boolean, (value: boolean) => void] {
  const [{ expertMode }, dispatch] = useSwapStore()
  return [expertMode, (value: boolean) => dispatch(setExpertMode(value))]
}

export function useMultihop(): [boolean, (value: boolean) => void] {
  const [{ multihop }, dispatch] = useSwapStore()
  return [multihop, (value: boolean) => dispatch(setMultihop(value))]
}
