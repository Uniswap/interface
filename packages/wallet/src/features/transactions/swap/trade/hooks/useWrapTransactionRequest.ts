import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useCallback } from 'react'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { useAsyncData } from 'utilities/src/react/hooks'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { getWethContract } from 'wallet/src/features/transactions/swap/wrapSaga'
import { WrapType } from 'wallet/src/features/transactions/types'
import { useProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function useWrapTransactionRequest(derivedSwapInfo: DerivedSwapInfo): providers.TransactionRequest | undefined {
  const address = useActiveAccountAddressWithThrow()
  const { chainId, wrapType, currencyAmounts, trade } = derivedSwapInfo
  const provider = useProvider(chainId)

  const transactionFetcher = useCallback(
    () =>
      getWrapTransactionRequest(
        provider,
        trade.trade,
        chainId,
        address,
        wrapType,
        currencyAmounts[CurrencyField.INPUT],
      ),
    [address, chainId, wrapType, currencyAmounts, provider, trade.trade],
  )

  return useAsyncData(transactionFetcher).data
}

const getWrapTransactionRequest = async (
  provider: providers.Provider | null,
  trade: Trade | null,
  chainId: WalletChainId,
  address: Address,
  wrapType: WrapType,
  currencyAmountIn: Maybe<CurrencyAmount<Currency>>,
): Promise<providers.TransactionRequest | undefined> => {
  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  if (!currencyAmountIn || !provider || (wrapType === WrapType.NotApplicable && !isUniswapXWrap)) {
    return
  }

  const wethContract = await getWethContract(chainId, provider)
  const wethTx =
    wrapType === WrapType.Wrap || isUniswapXWrap
      ? await wethContract.populateTransaction.deposit({
          value: `0x${currencyAmountIn.quotient.toString(16)}`,
        })
      : await wethContract.populateTransaction.withdraw(`0x${currencyAmountIn.quotient.toString(16)}`)

  return { ...wethTx, from: address, chainId }
}
