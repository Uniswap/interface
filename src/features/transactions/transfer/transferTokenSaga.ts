import { BigNumber, BigNumberish, providers } from 'ethers'
import ERC1155_ABI from 'src/abis/erc1155.json'
import ERC20_ABI from 'src/abis/erc20.json'
import ERC721_ABI from 'src/abis/erc721.json'
import { Erc1155, Erc20, Erc721 } from 'src/abis/types'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { AssetType } from 'src/entities/assets'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import {
  TransferCurrencyParams,
  TransferNFTParams,
  TransferTokenParams,
} from 'src/features/transactions/transfer/types'
import {
  SendTokenTransactionInfo,
  TransactionOptions,
  TransactionType,
} from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  const { account, chainId, type: assetType, tokenAddress } = params
  const provider = yield* call(getProvider, chainId)
  const contractManager = yield* call(getContractManager)

  let transactionRequest: providers.TransactionRequest
  let typeInfo: SendTokenTransactionInfo = {
    assetType,
    recipient: params.toAddress,
    tokenAddress,
    type: TransactionType.Send,
  }

  switch (assetType) {
    case AssetType.ERC1155:
    case AssetType.ERC721:
      typeInfo = {
        ...typeInfo,
        tokenId: params.tokenId,
      }
      transactionRequest = yield* call(prepareNFTTransfer, params, provider, contractManager)
      break
    case AssetType.Currency:
      typeInfo = {
        ...typeInfo,
        currencyAmountRaw: params.amountInWei,
      }

      if (tokenAddress === NATIVE_ADDRESS) {
        transactionRequest = yield* call(prepareNativeTransfer, params, provider)
      } else {
        transactionRequest = yield* call(prepareTokenTransfer, params, provider, contractManager)
      }

      break
  }

  const options: TransactionOptions = {
    request: transactionRequest,
    // TODO: fix fetch balance
    fetchBalanceOnSuccess: true,
  }

  yield* call(sendTransaction, {
    chainId,
    account,
    options,
    typeInfo,
  })

  logger.debug('transferToken', '', 'Transfer complete')
}

async function prepareNativeTransfer(params: TransferCurrencyParams, provider: providers.Provider) {
  const { account, toAddress, amountInWei } = params
  const currentBalance = await provider.getBalance(account.address)
  validateTransferAmount(amountInWei, currentBalance)
  const transactionRequest: providers.TransactionRequest = {
    from: account.address,
    to: toAddress,
    value: amountInWei,
  }
  return transactionRequest
}

async function prepareTokenTransfer(
  params: TransferCurrencyParams,
  provider: providers.Provider,
  contractManager: ContractManager
) {
  const { account, toAddress, chainId, tokenAddress, amountInWei } = params
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    tokenAddress,
    provider,
    ERC20_ABI
  )
  const currentBalance = await tokenContract.balanceOf(account.address)
  validateTransferAmount(amountInWei, currentBalance)
  const transactionRequest = await tokenContract.populateTransaction.transfer(
    toAddress,
    amountInWei
  )
  return transactionRequest
}

async function prepareNFTTransfer(
  params: TransferNFTParams,
  provider: providers.Provider,
  contractManager: ContractManager
) {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params

  const getTransactionRequest = async () => {
    switch (params.type) {
      case AssetType.ERC1155:
        const erc1155Contract = contractManager.getOrCreateContract<Erc1155>(
          chainId,
          tokenAddress,
          provider,
          ERC1155_ABI
        )
        validateTransferAmount('1', await erc1155Contract.balanceOf(account.address, tokenId))
        // TODO: handle `non ERC1155 Receiver implement` error
        return erc1155Contract.populateTransaction.safeTransferFrom(
          account.address,
          toAddress,
          tokenId,
          /*amount=*/ '1',
          /*data=*/ '0x0'
        )
      case AssetType.ERC721:
        const erc20Contract = contractManager.getOrCreateContract<Erc721>(
          chainId,
          tokenAddress,
          provider,
          ERC721_ABI
        )
        const currentBalance = await erc20Contract.balanceOf(account.address)
        validateTransferAmount('1', currentBalance)
        return erc20Contract.populateTransaction.transferFrom(account.address, toAddress, tokenId)
    }
  }

  return getTransactionRequest()
}

function validateTransferAmount(amountInWei: string, currentBalance: BigNumberish) {
  const amount = BigNumber.from(amountInWei)
  if (amount.lte(0)) {
    logger.error('transferToken', 'validateTransferAmount', 'Invalid transfer amount')
    throw new Error('Invalid transfer amount')
  }
  if (BigNumber.from(amountInWei).gt(currentBalance)) {
    logger.error('transferToken', 'validateTransferAmount', 'Balance insufficient for transfer')
    throw new Error('Insufficient balance')
  }
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')
