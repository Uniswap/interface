import { useCallback } from 'react'
import { openModal } from 'src/features/modals/modalSlice'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'

export const useNavigateToSend: () => (
  currencyAddress: Address,
  currencyChainId: ChainId
) => void = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (currencyAddress, currencyChainId) => {
      const initialSendState: TransactionState = {
        exactCurrencyField: CurrencyField.INPUT,
        exactAmountToken: '',
        [CurrencyField.INPUT]: {
          address: currencyAddress,
          chainId: currencyChainId,
          type: AssetType.Currency,
        },
        [CurrencyField.OUTPUT]: null,
        showRecipientSelector: true,
      }
      dispatch(openModal({ name: ModalName.Send, initialState: initialSendState }))
    },
    [dispatch]
  )
}
