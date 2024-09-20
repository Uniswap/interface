import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField, CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export enum TradeProtocolPreference {
  Default = 'Default',
  V2Only = 'V2Only',
  V3Only = 'V3Only',
}

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
  tradeProtocolPreference?: TradeProtocolPreference
}

export const prepareSwapFormState = ({
  inputCurrencyId,
}: {
  inputCurrencyId?: CurrencyId
}): TransactionState | undefined => {
  if (!inputCurrencyId) {
    return undefined
  }

  return {
    exactCurrencyField: CurrencyField.INPUT,
    exactAmountToken: '',
    [CurrencyField.INPUT]: {
      address: currencyIdToAddress(inputCurrencyId),
      chainId: (currencyIdToChain(inputCurrencyId) as WalletChainId) ?? UniverseChainId.Mainnet,
      type: AssetType.Currency,
    },
    [CurrencyField.OUTPUT]: null,
  }
}
