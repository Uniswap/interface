import { useMemo } from 'react'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

const getDefaultInputCurrency = (chainId: UniverseChainId): TradeableAsset => ({
  address: currencyAddress(getChainGasToken(chainId)),
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
  txHash: undefined,
  txHashReceivedTime: undefined,
})

export const useDefaultSwapFormState = (): ReturnType<typeof getDefaultState> => {
  const { defaultChainId } = useEnabledChains()

  return useMemo(() => getDefaultState(defaultChainId), [defaultChainId])
}
