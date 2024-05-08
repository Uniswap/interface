import { providers } from 'ethers'
import { useCallback } from 'react'
import ERC1155_ABI from 'uniswap/src/abis/erc1155.json'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import ERC721_ABI from 'uniswap/src/abis/erc721.json'
import { Erc1155, Erc20, Erc721 } from 'uniswap/src/abis/types'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  DerivedTransferInfo,
  TransferCurrencyParams,
  TransferNFTParams,
  TransferTokenParams,
} from 'wallet/src/features/transactions/transfer/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useContractManager, useProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { currencyAddress, isNativeCurrencyAddress } from 'wallet/src/utils/currencyId'

export function useTransferTransactionRequest(
  derivedTransferInfo: DerivedTransferInfo
): providers.TransactionRequest | undefined {
  const account = useActiveAccountWithThrow()
  const chainId = toSupportedChainId(derivedTransferInfo.chainId)
  const provider = useProvider(chainId ?? ChainId.Mainnet)
  const contractManager = useContractManager()

  const transactionFetcher = useCallback(() => {
    if (!provider) {
      return
    }

    return getTransferTransaction(provider, contractManager, account, derivedTransferInfo)
  }, [account, contractManager, derivedTransferInfo, provider])

  return useAsyncData(transactionFetcher).data
}

async function getTransferTransaction(
  provider: providers.Provider,
  contractManager: ContractManager,
  account: Account,
  derivedTransferInfo: DerivedTransferInfo
): Promise<providers.TransactionRequest | undefined> {
  const params = getTransferParams(account, derivedTransferInfo)
  if (!params) {
    return
  }

  const { type, tokenAddress, chainId } = params
  switch (type) {
    case AssetType.ERC1155:
      return getErc1155TransferRequest(params, provider, contractManager)
    case AssetType.ERC721:
      return getErc721TransferRequest(params, provider, contractManager)
    case AssetType.Currency:
      return isNativeCurrencyAddress(chainId, tokenAddress)
        ? getNativeTransferRequest(params)
        : getTokenTransferRequest(params, provider, contractManager)
  }
}

function getTransferParams(
  account: Account,
  derivedTransferInfo: DerivedTransferInfo
): TransferTokenParams | undefined {
  const { currencyAmounts, currencyTypes, chainId, recipient, currencyInInfo, nftIn } =
    derivedTransferInfo
  const tokenAddress = currencyInInfo
    ? currencyAddress(currencyInInfo.currency)
    : nftIn?.nftContract?.address
  const amount = currencyAmounts[CurrencyField.INPUT]?.quotient.toString()
  const assetType = currencyTypes[CurrencyField.INPUT]

  if (!chainId || !tokenAddress || !recipient || !assetType) {
    return
  }

  switch (assetType) {
    case AssetType.ERC1155:
    case AssetType.ERC721: {
      if (!nftIn) {
        return
      }

      return {
        account,
        chainId,
        toAddress: recipient,
        tokenAddress,
        type: assetType,
        tokenId: nftIn.tokenId,
      }
    }

    case AssetType.Currency: {
      if (!currencyInInfo || amount === undefined) {
        return
      }

      return {
        account,
        chainId,
        toAddress: recipient,
        tokenAddress,
        type: AssetType.Currency,
        amountInWei: amount,
      }
    }
  }
}

async function getErc721TransferRequest(
  params: TransferNFTParams,
  provider: providers.Provider,
  contractManager: ContractManager
): Promise<providers.TransactionRequest> {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params
  const erc721Contract = contractManager.getOrCreateContract<Erc721>(
    chainId,
    tokenAddress,
    provider,
    ERC721_ABI
  )
  const baseRequest = await erc721Contract.populateTransaction.transferFrom(
    account.address,
    toAddress,
    tokenId
  )

  return {
    ...baseRequest,
    chainId,
    from: account.address,
  }
}

async function getErc1155TransferRequest(
  params: TransferNFTParams,
  provider: providers.Provider,
  contractManager: ContractManager
): Promise<providers.TransactionRequest> {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params
  const erc1155Contract = contractManager.getOrCreateContract<Erc1155>(
    chainId,
    tokenAddress,
    provider,
    ERC1155_ABI
  )

  // TODO: [MOB-242] handle `non ERC1155 Receiver implement` error
  const baseRequest = await erc1155Contract.populateTransaction.safeTransferFrom(
    account.address,
    toAddress,
    tokenId,
    /*amount=*/ '1',
    /*data=*/ '0x0'
  )

  return {
    ...baseRequest,
    chainId,
    from: account.address,
  }
}

function getNativeTransferRequest(params: TransferCurrencyParams): providers.TransactionRequest {
  const { account, toAddress, amountInWei, chainId } = params
  return {
    from: account.address,
    to: toAddress,
    value: amountInWei,
    chainId,
  }
}

async function getTokenTransferRequest(
  params: TransferCurrencyParams,
  provider: providers.Provider,
  contractManager: ContractManager
): Promise<providers.TransactionRequest> {
  const { account, toAddress, chainId, tokenAddress, amountInWei } = params
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    tokenAddress,
    provider,
    ERC20_ABI
  )
  const transactionRequest = await tokenContract.populateTransaction.transfer(
    toAddress,
    amountInWei,
    { from: account.address }
  )
  return { ...transactionRequest, chainId }
}
