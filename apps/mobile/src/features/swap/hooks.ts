import { useCallback } from 'react'
import { openModal } from 'src/features/modals/modalSlice'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType, CurrencyAsset } from 'wallet/src/entities/assets'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

export const useNavigateToSwap: () => (
  currencyField: CurrencyField,
  currencyAddress: Address,
  currencyChainId: ChainId
) => void = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (currencyField, currencyAddress, currencyChainId) => {
      const nativeTokenAddress = getNativeAddress(currencyChainId)
      const nativeToken: CurrencyAsset = {
        address: nativeTokenAddress,
        chainId: currencyChainId,
        type: AssetType.Currency,
      }
      const chosenToken: CurrencyAsset = {
        address: currencyAddress,
        chainId: currencyChainId,
        type: AssetType.Currency,
      }

      const opposedToken = areAddressesEqual(nativeTokenAddress, currencyAddress)
        ? null
        : nativeToken

      const swapFormState: TransactionState = {
        exactCurrencyField: currencyField,
        exactAmountToken: '',
        [CurrencyField.INPUT]: currencyField === CurrencyField.INPUT ? chosenToken : opposedToken,
        [CurrencyField.OUTPUT]: currencyField === CurrencyField.OUTPUT ? chosenToken : opposedToken,
      }
      dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
    },
    [dispatch]
  )
}
