import { useAtom } from 'jotai'
import { useContext } from 'react'

import { StoreAtomContext } from '.'
import {
  resetSettings,
  setExpertMode,
  setGasPrice,
  setMaxSlippage,
  setMultiHop,
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

export function useGasPrice(): [GasPrice, (value: GasPrice) => void] {
  const [{ gasPrice }, dispatch] = useSwapStore()
  return [gasPrice, (value: GasPrice) => dispatch(setGasPrice(value))]
}

export function useMaxSlippage(): [MaxSlippage, (value: MaxSlippage) => void] {
  const [{ maxSlippage }, dispatch] = useSwapStore()
  return [maxSlippage, (value: MaxSlippage) => dispatch(setMaxSlippage(value))]
}

export function useTransactionDeadline(): [number, (value: number) => void] {
  const [{ transactionDeadline }, dispatch] = useSwapStore()
  return [transactionDeadline, (value: number) => dispatch(setTransactionDeadline(value))]
}

export function useExpertMode(): [boolean, (value: boolean) => void] {
  const [{ expertMode }, dispatch] = useSwapStore()
  return [expertMode, (value: boolean) => dispatch(setExpertMode(value))]
}

export function useMultiHop(): [boolean, (value: boolean) => void] {
  const [{ multiHop }, dispatch] = useSwapStore()
  return [multiHop, (value: boolean) => dispatch(setMultiHop(value))]
}
