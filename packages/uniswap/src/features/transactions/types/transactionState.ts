import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField, CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { FiatOffRampMetaData } from 'uniswap/src/features/fiatOnRamp/types'

export interface TransactionState {
  txId?: string
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  isMax?: boolean
  exactAmountFiat?: string
  focusOnCurrencyField?: CurrencyField | null
  recipient?: string
  isFiatInput?: boolean
  selectingCurrencyField?: CurrencyField
  showRecipientSelector?: boolean
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols?: FrontendSupportedProtocol[]
  fiatOffRampMetaData?: FiatOffRampMetaData
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
