import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useCallback } from 'react'
import { WalletChainId } from 'uniswap/src/types/chains'
import { useAsyncData } from 'utilities/src/react/hooks'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { getWethContract } from 'wallet/src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'
import { useProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo
): providers.TransactionRequest | undefined {
  const address = useActiveAccountAddressWithThrow()
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo
  const provider = useProvider(chainId)

  const transactionFetcher = useCallback(() => {
    if (!provider || wrapType === WrapType.NotApplicable) {
      return
    }

    return getWrapTransactionRequest(
      provider,
      chainId,
      address,
      wrapType,
      currencyAmounts[CurrencyField.INPUT]
    )
  }, [address, chainId, wrapType, currencyAmounts, provider])

  return useAsyncData(transactionFetcher).data
}

const getWrapTransactionRequest = async (
  provider: providers.Provider,
  chainId: WalletChainId,
  address: Address,
  wrapType: WrapType,
  currencyAmountIn: Maybe<CurrencyAmount<Currency>>
): Promise<providers.TransactionRequest | undefined> => {
  if (!currencyAmountIn) {
    return
  }

  const wethContract = await getWethContract(chainId, provider)
  const wethTx =
    wrapType === WrapType.Wrap
      ? await wethContract.populateTransaction.deposit({
          value: `0x${currencyAmountIn.quotient.toString(16)}`,
        })
      : await wethContract.populateTransaction.withdraw(
          `0x${currencyAmountIn.quotient.toString(16)}`
        )

  return { ...wethTx, from: address, chainId }
}
