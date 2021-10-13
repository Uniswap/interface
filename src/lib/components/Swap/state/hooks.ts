import { useUpdateAtom } from 'jotai/utils'
import useSelectedReducerAtom from 'lib/hooks/useSelectedReducerAtom'

import { swapAtom } from '.'
import {
  resetSettings,
  setGasPrice,
  setMaxSlippage,
  setTransactionDeadline,
  toggleExpertMode,
  toggleMultihop,
  toggleShowDetails,
} from './actions'

export function useShowDetails() {
  return useSelectedReducerAtom(swapAtom, ({ showDetails }) => showDetails, toggleShowDetails)
}

export function useResetSettings() {
  const dispatch = useUpdateAtom(swapAtom)
  return () => dispatch(resetSettings())
}

export function useGasPrice() {
  return useSelectedReducerAtom(swapAtom, ({ gasPrice }) => gasPrice, setGasPrice)
}

export function useMaxSlippage() {
  return useSelectedReducerAtom(swapAtom, ({ maxSlippage }) => maxSlippage, setMaxSlippage)
}

export function useTransactionDeadline() {
  return useSelectedReducerAtom(swapAtom, ({ transactionDeadline }) => transactionDeadline, setTransactionDeadline)
}

export function useExpertMode() {
  return useSelectedReducerAtom(swapAtom, ({ expertMode }) => expertMode, toggleExpertMode)
}

export function useMultihop() {
  return useSelectedReducerAtom(swapAtom, ({ multihop }) => multihop, toggleMultihop)
}
