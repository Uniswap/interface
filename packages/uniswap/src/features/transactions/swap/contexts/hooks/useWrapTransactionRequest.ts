import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Contract, providers } from 'ethers/lib/ethers'
import { useCallback } from 'react'
import { Weth } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useAsyncData } from 'utilities/src/react/hooks'

export function getWrappedNativeContract(chainId: UniverseChainId): Weth {
  return new Contract(getWrappedNativeAddress(chainId), WETH_ABI) as Weth
}

export function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  account?: AccountMeta,
): providers.TransactionRequest | undefined {
  const { wrapType, currencyAmounts, trade } = derivedSwapInfo
  const isUniswapXWrap = Boolean(trade.trade && isUniswapX(trade.trade) && trade.trade.needsWrap)

  const transactionFetcher = useCallback(() => {
    const currencyAmountIn = currencyAmounts.input
    const from = account?.address
    if (!currencyAmountIn || (wrapType === WrapType.NotApplicable && !isUniswapXWrap)) {
      return undefined
    }

    return getWrapTransactionRequest({ currencyAmountIn, from })
  }, [account, isUniswapXWrap, wrapType, currencyAmounts.input])

  return useAsyncData(transactionFetcher).data
}

function isValidWrapInputCurrency(currency: Currency): boolean {
  return currency.isNative || currency.equals(nativeOnChain(currency.chainId).wrapped)
}

/**
 * Generates a transaction request for wrapping/unwrapping native currency
 * @param ctx - Transaction context containing input amount and sender address
 * @throws {Error} If input validation or request generation fails
 * @returns Populated transaction request
 */
export async function getWrapTransactionRequest(ctx: {
  currencyAmountIn: CurrencyAmount<Currency>
  from: Address | undefined
}): Promise<providers.TransactionRequest> {
  const { currencyAmountIn, from } = ctx
  const { currency } = currencyAmountIn
  const { chainId } = currency
  const wrappedNativeContract = getWrappedNativeContract(chainId)

  if (!isValidWrapInputCurrency(currency)) {
    throw new Error('Invalid wrap input currency')
  }

  const value = `0x${currencyAmountIn.quotient.toString(16)}`
  const isWrap = currency.isNative

  const tx = isWrap
    ? await wrappedNativeContract.populateTransaction.deposit({ value, from })
    : await wrappedNativeContract.populateTransaction.withdraw(value)

  return { ...tx, from, chainId }
}
