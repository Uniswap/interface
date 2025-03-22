import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Contract, providers, Signer } from 'ethers/lib/ethers'
import { useCallback } from 'react'
import invariant from 'tiny-invariant'
import { call } from 'typed-redux-saga'
import { AUniswap, Weth } from 'uniswap/src/abis/types'
import AUNISWAP_ABI from 'uniswap/src/abis/aUniswap.json'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { useProvider, useSigner } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useAsyncData } from 'utilities/src/react/hooks'

export async function getWethContract(chainId: UniverseChainId, provider: providers.Provider): Promise<Weth> {
  return new Contract(getWrappedNativeAddress(chainId), WETH_ABI, provider) as Weth
}

export async function getWrapperContract(address: string, provider: providers.Provider): Promise<AUniswap> {
  return new Contract(address, AUNISWAP_ABI, provider) as AUniswap
}

export function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  account?: AccountMeta,
): providers.TransactionRequest | undefined {
  const { chainId, wrapType, currencyAmounts, trade } = derivedSwapInfo
  const provider = useProvider(chainId)
  const isUniswapXWrap = Boolean(trade.trade && isUniswapX(trade.trade) && trade.trade.needsWrap)

  const signer = useSigner();

  const transactionFetcher = useCallback(
    () =>
      getWrapTransactionRequest(provider, signer, isUniswapXWrap, chainId, account?.address, wrapType, currencyAmounts.input),
    [provider, isUniswapXWrap, chainId, account, wrapType, currencyAmounts.input],
  )

  return useAsyncData(transactionFetcher).data
}

export const getWrapTransactionRequest = async (
  provider: providers.Provider | undefined,
  signer: Signer | undefined,
  isUniswapXWrap: boolean,
  chainId: UniverseChainId,
  address: Address | undefined,
  wrapType: WrapType,
  currencyAmountIn: Maybe<CurrencyAmount<Currency>>,
): Promise<providers.TransactionRequest | undefined> => {
  if (!currencyAmountIn || !provider || !address || !signer || (wrapType === WrapType.NotApplicable && !isUniswapXWrap)) {
    return undefined
  }
  console.log('address', address)
  
  const signerAddress = await signer.getAddress()
  const wrapperContract = await getWrapperContract(address, provider)
  const wethTx =
    wrapType === WrapType.Wrap || isUniswapXWrap
      ? await wrapperContract.populateTransaction.wrapETH(`0x${currencyAmountIn.quotient.toString(16)}`)
      : await wrapperContract.populateTransaction.unwrapWETH9(`0x${currencyAmountIn.quotient.toString(16)}`)

  // TODO: overwrite from with smart pool address
  return { ...wethTx, from: signerAddress, chainId }
}
