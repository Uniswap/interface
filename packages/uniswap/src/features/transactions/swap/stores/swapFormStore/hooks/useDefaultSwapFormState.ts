import { useMemo } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { CurrencyField } from 'uniswap/src/types/currency'

const getDefaultInputCurrency = (chainId: UniverseChainId): TradeableAsset => ({
  address: getNativeAddress(chainId),
  chainId,
  type: AssetType.Currency,
})

export const getDefaultState = (defaultChainId: UniverseChainId): Readonly<Omit<SwapFormState, 'account'>> => ({
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  filteredChainIds: {},
  input: getDefaultInputCurrency(defaultChainId),
  output: undefined,
  isFiatMode: false,
  isMax: false,
  isSubmitting: false,
  isConfirmed: false,
  showPendingUI: false,
  instantReceiptFetchTime: undefined,
  instantOutputAmountRaw: undefined,
  txHash: undefined,
  txHashReceivedTime: undefined,
})

export const useDefaultSwapFormState = (): ReturnType<typeof getDefaultState> => {
  const { defaultChainId } = useEnabledChains()

  return useMemo(() => getDefaultState(defaultChainId), [defaultChainId])
}
