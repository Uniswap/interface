import { useAtom } from 'jotai'

import { storeAtom } from '.'
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

export function useShowDetails(): [boolean, () => void] {
  const [{ showDetails }, dispatch] = useAtom(storeAtom)
  return [showDetails, () => dispatch(toggleShowDetails())]
}

export function useResetSettings() {
  const [, dispatch] = useAtom(storeAtom)
  return () => dispatch(resetSettings())
}

export function useGasPrice(): [[GasPrice, number | undefined], (value: GasPrice, custom?: number) => void] {
  const [{ gasPrice, customGasPrice }, dispatch] = useAtom(storeAtom)
  return [
    [gasPrice, customGasPrice],
    (gasPrice: GasPrice, customGasPrice?: number) => dispatch(setGasPrice({ gasPrice, customGasPrice })),
  ]
}

export function useMaxSlippage(): [[MaxSlippage, number | undefined], (value: MaxSlippage, custom?: number) => void] {
  const [{ maxSlippage, customMaxSlippage }, dispatch] = useAtom(storeAtom)
  return [
    [maxSlippage, customMaxSlippage],
    (maxSlippage: MaxSlippage, customMaxSlippage?: number) =>
      dispatch(setMaxSlippage({ maxSlippage, customMaxSlippage })),
  ]
}

export function useTransactionDeadline(): [number, (value: number) => void] {
  const [{ transactionDeadline }, dispatch] = useAtom(storeAtom)
  return [transactionDeadline, (value: number) => dispatch(setTransactionDeadline(value))]
}

export function useExpertMode(): [boolean, (value: boolean) => void] {
  const [{ expertMode }, dispatch] = useAtom(storeAtom)
  return [expertMode, (value: boolean) => dispatch(setExpertMode(value))]
}

export function useMultihop(): [boolean, (value: boolean) => void] {
  const [{ multihop }, dispatch] = useAtom(storeAtom)
  return [multihop, (value: boolean) => dispatch(setMultihop(value))]
}
