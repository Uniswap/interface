import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField, CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export interface TransactionState {
  txId?: string
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  exactAmountFiat?: string
  focusOnCurrencyField?: CurrencyField | null
  recipient?: string
  isFiatInput?: boolean
  selectingCurrencyField?: CurrencyField
  showRecipientSelector?: boolean
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols?: FrontendSupportedProtocol[]
}

export const prepareSwapFormState = ({
  inputCurrencyId,
  defaultChainId,
}: {
  inputCurrencyId?: CurrencyId
  defaultChainId: UniverseChainId
}): TransactionState | undefined => {
  if (!inputCurrencyId) {
    return undefined
  }

  return {
    exactCurrencyField: CurrencyField.INPUT,
    exactAmountToken: '',
    [CurrencyField.INPUT]: {
      address: currencyIdToAddress(inputCurrencyId),
      chainId: (currencyIdToChain(inputCurrencyId) as UniverseChainId) ?? defaultChainId,
      type: AssetType.Currency,
    },
    [CurrencyField.OUTPUT]: null,
  }
}
