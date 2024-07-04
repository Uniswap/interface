import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { WalletChainId } from 'uniswap/src/types/chains'
import { AssetType, CurrencyAsset } from 'wallet/src/entities/assets'
import { CurrencyField, TransactionState } from 'wallet/src/features/transactions/transactionState/types'

export function getSendPrefilledState({
  chainId,
  currencyAddress,
}: {
  chainId: WalletChainId
  currencyAddress?: Address
}): TransactionState {
  const nativeTokenAddress = getNativeAddress(chainId)

  const nativeToken: CurrencyAsset = {
    address: nativeTokenAddress,
    chainId,
    type: AssetType.Currency,
  }

  const chosenToken: CurrencyAsset | undefined = !currencyAddress
    ? undefined
    : {
        address: currencyAddress,
        chainId,
        type: AssetType.Currency,
      }

  const transactionState: TransactionState = {
    exactCurrencyField: CurrencyField.INPUT,
    exactAmountToken: '',
    // If specified currency address populate the currency, otherwise default to native token on chain
    [CurrencyField.INPUT]: chosenToken ?? nativeToken,
    [CurrencyField.OUTPUT]: null,
    showRecipientSelector: true,
  }

  return transactionState
}
