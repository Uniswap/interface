import { TransactionRequest } from '@ethersproject/abstract-provider'
import type { Web3Provider } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20 } from 'uniswap/src/abis/types'
import { getContract } from 'utilities/src/contracts/getContract'
import { useAsyncData } from 'utilities/src/react/hooks'

interface TransferInfo {
  provider?: Web3Provider
  account?: string
  chainId?: ChainId
  currencyAmount?: CurrencyAmount<Currency>
  toAddress?: string
}

interface TransferCurrencyParams {
  provider: Web3Provider
  account: string
  chainId: ChainId
  toAddress: string
  tokenAddress: string
  amountInWei: string
}

export function useCreateTransferTransaction(transferInfo: TransferInfo) {
  const transactionFetcher = useCallback(() => {
    return getTransferTransaction(transferInfo)
  }, [transferInfo])

  return useAsyncData(transactionFetcher).data
}

async function getTransferTransaction(transferInfo: TransferInfo): Promise<TransactionRequest | undefined> {
  const { provider, account, chainId, currencyAmount, toAddress } = transferInfo

  if (!provider || !account || !chainId || !currencyAmount || !toAddress) {
    return
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

async function getTokenTransferRequest(
  transferParams: TransferCurrencyParams
): Promise<TransactionRequest | undefined> {
  const { provider, account, chainId, toAddress, tokenAddress, amountInWei } = transferParams
  const tokenContract = getContract(tokenAddress, ERC20_ABI, provider, account) as Erc20

  try {
    const populatedTransaction = await tokenContract.populateTransaction.transfer(toAddress, amountInWei, {
      from: account,
    })

    return { ...populatedTransaction, chainId }
  } catch (_) {
    console.error('could not populate transaction')
  }

  return undefined
}

// TODO: https://linear.app/uniswap/issue/WEB-3495/import-useasyncdata-from-mobile
export function useIsSmartContractAddress(address?: string): {
  loading: boolean
  isSmartContractAddress: boolean
} {
  const { provider } = useWeb3React()

  const fetchIsSmartContractAddress = useCallback(async () => {
    if (!address) {
      return false
    }
    const code = await provider?.getCode(address)
    // provider.getCode(address) will return a hex string if a smart contract is deployed at that address
    // returning just 0x means there's no code and it's not a smart contract
    return code !== '0x'
  }, [provider, address])

  const { data, isLoading } = useAsyncData(fetchIsSmartContractAddress)
  return { isSmartContractAddress: !!data, loading: isLoading }
}
