import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { CurrencyField } from 'uniswap/src/types/currency'

const getDefaultInputCurrency = (chainId: UniverseChainId): TradeableAsset => ({
  address: getNativeAddress(chainId),
  chainId,
  type: AssetType.Currency,
})

const getDefaultOutputCurrency = (chainId: UniverseChainId): TradeableAsset | undefined => {
  // For Citrea Testnet, default output to cUSD
  if (chainId === UniverseChainId.CitreaTestnet) {
    return {
      address: '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0', // cUSD on Citrea Testnet
      chainId,
      type: AssetType.Currency,
    }
  }
  // For Sepolia, default output to cUSD
  if (chainId === UniverseChainId.Sepolia) {
    return {
      address: '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0', // cUSD on Sepolia
      chainId,
      type: AssetType.Currency,
    }
  }
  return undefined
}

export const getDefaultState = (defaultChainId: UniverseChainId): Readonly<Omit<SwapFormState, 'account'>> => ({
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  filteredChainIds: {},
  input: getDefaultInputCurrency(defaultChainId),
  output: getDefaultOutputCurrency(defaultChainId),
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
