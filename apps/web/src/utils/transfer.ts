import { TransactionRequest } from '@ethersproject/abstract-provider'
import type { Web3Provider } from '@ethersproject/providers'
import { useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20 } from 'uniswap/src/abis/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getContract } from 'utilities/src/contracts/getContract'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

interface TransferInfo {
  provider?: Web3Provider
  account?: string
  chainId?: UniverseChainId
  currencyAmount?: CurrencyAmount<Currency>
  toAddress?: string
}

interface TransferCurrencyParams {
  provider: Web3Provider
  account: string
  chainId: UniverseChainId
  toAddress: string
  tokenAddress: string
  amountInWei: string
}

export function useCreateTransferTransaction(transferInfo: TransferInfo | undefined): Maybe<TransactionRequest> {
  const transactionFetcher = useCallback(() => {
    return getTransferTransaction(transferInfo)
  }, [transferInfo])

  return useQuery({
    queryFn: transactionFetcher,
    queryKey: [
      ReactQueryCacheKey.CreateTransferTransaction,
      transferInfo?.account,
      transferInfo?.chainId,
      transferInfo?.currencyAmount?.toExact(),
      transferInfo?.currencyAmount?.currency,
      transferInfo?.toAddress,
    ],
  }).data
}

async function getTransferTransaction(transferInfo: TransferInfo | undefined): Promise<TransactionRequest | null> {
  if (!transferInfo) {
    return null
  }

  const { provider, account, chainId, currencyAmount, toAddress } = transferInfo

  if (!provider || !account || !chainId || !currencyAmount || !toAddress) {
    return null
  }

  const currency = currencyAmount.currency
  const params = {
    provider,
    account,
    chainId,
    toAddress,
    tokenAddress: currency.isNative ? '' : currency.address,
    amountInWei: currencyAmount.quotient.toString(),
  }

  return currency.isNative ? getNativeTransferRequest(params) : getTokenTransferRequest(params)
}

function getNativeTransferRequest(params: TransferCurrencyParams): TransactionRequest {
  const { account, toAddress, amountInWei, chainId } = params

  return {
    from: account,
    to: toAddress,
    value: amountInWei,
    chainId,
  }
}

async function getTokenTransferRequest(transferParams: TransferCurrencyParams): Promise<TransactionRequest | null> {
  const { provider, account, chainId, toAddress, tokenAddress, amountInWei } = transferParams
  const tokenContract = getContract({ address: tokenAddress, ABI: ERC20_ABI, provider, account }) as Erc20

  try {
    const populatedTransaction = await tokenContract.populateTransaction.transfer(toAddress, amountInWei, {
      from: account,
    })

    return { ...populatedTransaction, chainId }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'transfer',
        function: 'getTokenTransferRequest',
      },
      extra: { transferParams },
    })
  }

  return null
}
