import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { providers } from 'ethers'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import ERC721_ABI from 'uniswap/src/abis/erc721.json'
import ERC1155_ABI from 'uniswap/src/abis/erc1155.json'
import { Erc20, Erc721, Erc1155 } from 'uniswap/src/abis/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { SendCurrencyParams, SendNFTParams, SendTokenParams } from 'wallet/src/features/transactions/send/types'
import { useContractManager, useProvider } from 'wallet/src/features/wallet/context'
import { useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

export function useSendTransactionRequest(
  derivedSendInfo: DerivedSendInfo,
): UseQueryResult<providers.TransactionRequest | null> {
  const { defaultChainId } = useEnabledChains()
  const account = useActiveSignerAccount()
  const chainId = toSupportedChainId(derivedSendInfo.chainId)
  const provider = useProvider(chainId ?? defaultChainId)
  const contractManager = useContractManager()

  const transactionFetcher = useCallback(async (): Promise<providers.TransactionRequest | null> => {
    if (!provider || !account) {
      return null
    }

    return (await getSendTransaction({ provider, contractManager, account, derivedSendInfo })) ?? null
  }, [account, contractManager, derivedSendInfo, provider])

  return useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.CreateTransferTransaction, derivedSendInfo, account],
      queryFn: transactionFetcher,
    }),
  )
}

// eslint-disable-next-line consistent-return
async function getSendTransaction({
  provider,
  contractManager,
  account,
  derivedSendInfo,
}: {
  provider: providers.Provider
  contractManager: ContractManager
  account: SignerMnemonicAccountMeta
  derivedSendInfo: DerivedSendInfo
}): Promise<providers.TransactionRequest | undefined> {
  const params = getSendParams(account, derivedSendInfo)
  if (!params) {
    return undefined
  }

  const { type, tokenAddress, chainId } = params
  switch (type) {
    case AssetType.ERC1155:
      return getErc1155SendRequest({ params, provider, contractManager })
    case AssetType.ERC721:
      return getErc721SendRequest({ params, provider, contractManager })
    case AssetType.Currency:
      return isNativeCurrencyAddress(chainId, tokenAddress)
        ? getNativeSendRequest(params)
        : getTokenSendRequest({ params, provider, contractManager })
  }
}

// eslint-disable-next-line consistent-return
function getSendParams(
  account: SignerMnemonicAccountMeta,
  derivedSendInfo: DerivedSendInfo,
): SendTokenParams | undefined {
  const { currencyAmounts, currencyTypes, chainId, recipient, currencyInInfo, nftIn } = derivedSendInfo
  const tokenAddress = currencyInInfo ? currencyAddress(currencyInInfo.currency) : nftIn?.nftContract?.address
  const amount = currencyAmounts[CurrencyField.INPUT]?.quotient.toString()
  const assetType = currencyTypes[CurrencyField.INPUT]

  if (!tokenAddress || !recipient || !assetType) {
    return undefined
  }

  switch (assetType) {
    case AssetType.ERC1155:
    case AssetType.ERC721: {
      if (!nftIn) {
        return undefined
      }

      return {
        account,
        chainId: chainId as UniverseChainId,
        toAddress: recipient,
        tokenAddress,
        type: assetType,
        tokenId: nftIn.tokenId,
      }
    }

    case AssetType.Currency: {
      if (!currencyInInfo || amount === undefined) {
        return undefined
      }

      return {
        account,
        chainId: chainId as UniverseChainId,
        toAddress: recipient,
        tokenAddress,
        type: AssetType.Currency,
        amountInWei: amount,
      }
    }
  }
}

async function getErc721SendRequest({
  params,
  provider,
  contractManager,
}: {
  params: SendNFTParams
  provider: providers.Provider
  contractManager: ContractManager
}): Promise<providers.TransactionRequest> {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params
  const erc721Contract = contractManager.getOrCreateContract<Erc721>({
    chainId,
    address: tokenAddress,
    provider,
    ABI: ERC721_ABI,
  })
  const baseRequest = await erc721Contract.populateTransaction.transferFrom(account.address, toAddress, tokenId)

  return {
    ...baseRequest,
    chainId,
    from: account.address,
  }
}

async function getErc1155SendRequest({
  params,
  provider,
  contractManager,
}: {
  params: SendNFTParams
  provider: providers.Provider
  contractManager: ContractManager
}): Promise<providers.TransactionRequest> {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params
  const erc1155Contract = contractManager.getOrCreateContract<Erc1155>({
    chainId,
    address: tokenAddress,
    provider,
    ABI: ERC1155_ABI,
  })

  // TODO: [MOB-242] handle `non ERC1155 Receiver implement` error
  const baseRequest = await erc1155Contract.populateTransaction.safeTransferFrom(
    account.address,
    toAddress,
    tokenId,
    /*amount=*/ '1',
    /*data=*/ '0x0',
  )

  return {
    ...baseRequest,
    chainId,
    from: account.address,
  }
}

function getNativeSendRequest(params: SendCurrencyParams): providers.TransactionRequest {
  const { account, toAddress, amountInWei, chainId } = params
  return {
    from: account.address,
    to: toAddress,
    value: amountInWei,
    chainId,
  }
}

export async function getTokenSendRequest({
  params,
  provider,
  contractManager,
}: {
  params: SendCurrencyParams
  provider: providers.Provider
  contractManager: ContractManager
}): Promise<providers.TransactionRequest> {
  const { account, toAddress, chainId, tokenAddress, amountInWei } = params
  const tokenContract = contractManager.getOrCreateContract<Erc20>({
    chainId,
    address: tokenAddress,
    provider,
    ABI: ERC20_ABI,
  })
  const transactionRequest = await tokenContract.populateTransaction.transfer(toAddress, amountInWei, {
    from: account.address,
  })
  return { ...transactionRequest, chainId }
}
