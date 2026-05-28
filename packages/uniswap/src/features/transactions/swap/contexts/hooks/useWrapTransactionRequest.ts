import { getFewTokenFromOriginalToken, isFewToken } from '@ring-protocol/few-v2-sdk'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Contract, ContractInterface, providers } from 'ethers/lib/ethers'
import { useCallback } from 'react'
import FEWETHWRAPPER_ABI from 'uniswap/src/abis/fewethwrapper.json'
import FEWTOKEN_ABI from 'uniswap/src/abis/fewtoken.json'
import { Weth } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getFewETHWrapperAddress, getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useAsyncData } from 'utilities/src/react/hooks'

export function getWrappedNativeContract(chainId: UniverseChainId): Weth {
  return new Contract(getWrappedNativeAddress(chainId), WETH_ABI) as Weth
}

export function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  account?: AccountMeta,
): providers.TransactionRequest | undefined {
  const { wrapType, currencyAmounts, currencies } = derivedSwapInfo

  const transactionFetcher = useCallback(() => {
    const currencyAmountIn = currencyAmounts.input
    const from = account?.address

    if (!currencyAmountIn || wrapType === WrapType.NotApplicable) {
      return undefined
    }

    const currencyOut = currencies[CurrencyField.OUTPUT]?.currency
    const result = getWrapTransactionRequest({
      currencyAmountIn,
      from,
      wrapType,
      currencyOut,
    })
    return result
  }, [account, wrapType, currencyAmounts.input, currencies])

  return useAsyncData(transactionFetcher).data
}

function isValidWrapInputCurrency(currency: Currency, wrapType: WrapType): boolean {
  if (wrapType === WrapType.FewWrap || wrapType === WrapType.FewUnwrap) {
    return true
  }
  return currency.isNative || currency.equals(nativeOnChain(currency.chainId).wrapped)
}

/**
 * Generates a transaction request for wrapping/unwrapping native currency or FewToken wrap
 * @param ctx - Transaction context containing input amount, sender address, wrapType, and output currency
 * @throws {Error} If input validation or request generation fails
 * @returns Populated transaction request
 */
export async function getWrapTransactionRequest(ctx: {
  currencyAmountIn: CurrencyAmount<Currency>
  from: Address | undefined
  wrapType: WrapType
  currencyOut?: Currency
}): Promise<providers.TransactionRequest> {
  const { currencyAmountIn, from, wrapType, currencyOut } = ctx

  if (wrapType === WrapType.FewWrap) {
    return getFewWrapTransactionRequest(currencyAmountIn, from, currencyOut)
  }

  if (wrapType === WrapType.FewUnwrap) {
    return getFewUnwrapTransactionRequest(currencyAmountIn, from, currencyOut)
  }

  const { currency } = currencyAmountIn
  const { chainId } = currency

  if (!isValidWrapInputCurrency(currency, wrapType)) {
    throw new Error('Invalid wrap input currency')
  }
  // Handle regular ETH <-> WETH wrap
  const wrappedNativeContract = getWrappedNativeContract(chainId)
  const value = `0x${currencyAmountIn.quotient.toString(16)}`
  const isWrap = currency.isNative

  const tx = isWrap
    ? await wrappedNativeContract.populateTransaction.deposit({ value, from })
    : await wrappedNativeContract.populateTransaction.withdraw(value)

  return { ...tx, from, chainId }
}

async function getFewWrapTransactionRequest(
  currencyAmountIn: CurrencyAmount<Currency>,
  from: Address | undefined,
  currencyOut?: Currency,
): Promise<providers.TransactionRequest> {
  const { currency } = currencyAmountIn
  const { chainId } = currency

  if (!currencyOut || !currency) {
    throw new Error('FewWrap requires output currency and non-native input')
  }

  const inputToken = currency.isNative ? currency.wrapped : (currency as Token)
  const outputToken = currencyOut.isNative ? currencyOut.wrapped : (currencyOut as Token)

  // Verify that output is indeed a FewToken
  if (!isFewToken(outputToken)) {
    throw new Error('FewWrap output must be a FewToken')
  }

  const expectedFewToken = getFewTokenFromOriginalToken(inputToken, chainId)
  if (outputToken.address.toLowerCase() !== expectedFewToken.address.toLowerCase()) {
    throw new Error('FewWrap output token does not match expected FewToken')
  }

  if (currency.isNative) {
    // Call FewETHWrapper contract's wrapETHToFWWETH(address to) method
    const fewETHWrapperContract = new Contract(getFewETHWrapperAddress(chainId), FEWETHWRAPPER_ABI as ContractInterface)
    const wrapEthFn = fewETHWrapperContract.populateTransaction.wrapETHToFWWETH
    if (!wrapEthFn) {
      throw new Error('FewETHWrapper contract wrapETHToFWWETH method unavailable')
    }
    const amount = currencyAmountIn.quotient.toString()
    const tx = await wrapEthFn(from, { value: amount })
    return { ...tx, from, chainId }
  } else {
    // Call FewToken contract's wrap(uint256 amount) method
    // The wrap method will transfer the original token from the user and mint FewToken
    const fewTokenContract = new Contract(outputToken.address, FEWTOKEN_ABI.abi as ContractInterface)
    const amount = currencyAmountIn.quotient.toString()

    const wrapFn = fewTokenContract.populateTransaction.wrap
    if (!wrapFn) {
      throw new Error('FewToken contract wrap method unavailable')
    }
    const tx = await wrapFn(amount)
    return { ...tx, from, chainId }
  }
}

async function getFewUnwrapTransactionRequest(
  currencyAmountIn: CurrencyAmount<Currency>,
  from: Address | undefined,
  currencyOut?: Currency,
): Promise<providers.TransactionRequest> {
  const { currency } = currencyAmountIn
  const { chainId } = currency

  if (!currencyOut) {
    throw new Error('FewUnwrap requires output currency')
  }

  const inputToken = currency.isNative ? currency.wrapped : (currency as Token)
  const outputToken = currencyOut.isNative ? currencyOut.wrapped : (currencyOut as Token)

  if (!isFewToken(inputToken)) {
    throw new Error('FewUnwrap input must be a FewToken')
  }

  const expectedFewToken = getFewTokenFromOriginalToken(outputToken, chainId)
  if (inputToken.address.toLowerCase() !== expectedFewToken.address.toLowerCase()) {
    throw new Error('FewUnwrap input token does not match expected FewToken')
  }
  if (currencyOut.isNative) {
    // Call FewEthToken contract's unwrapFWWETHToETH(uint amount, address to) method
    const fewEthTokenContract = new Contract(getFewETHWrapperAddress(chainId), FEWETHWRAPPER_ABI as ContractInterface)
    const amount = currencyAmountIn.quotient.toString()

    const unwrapEthFn = fewEthTokenContract.populateTransaction.unwrapFWWETHToETH
    if (!unwrapEthFn) {
      throw new Error('FewETHWrapper contract unwrapFWWETHToETH method unavailable')
    }
    const tx = await unwrapEthFn(amount, from)
    return { ...tx, from, chainId }
  } else {
    // Call FewToken contract's unwrap(uint256 amount) method
    // The unwrap method will burn FewToken and return the original token to the user
    const fewTokenContract = new Contract(inputToken.address, FEWTOKEN_ABI.abi as ContractInterface)
    const amount = currencyAmountIn.quotient.toString()

    const unwrapFn = fewTokenContract.populateTransaction.unwrap
    if (!unwrapFn) {
      throw new Error('FewETHWrapper contract unwrapFWWETHToETH method unavailable')
    }
    const tx = await unwrapFn(amount)
    return { ...tx, from, chainId }
  }
}
