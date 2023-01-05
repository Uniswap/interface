import { BigNumber, BigNumberish, providers } from 'ethers'
import ERC1155_ABI from 'src/abis/erc1155.json'
import ERC20_ABI from 'src/abis/erc20.json'
import ERC721_ABI from 'src/abis/erc721.json'
import { Erc1155, Erc20, Erc721 } from 'src/abis/types'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { AssetType } from 'src/entities/assets'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { TransferTokenParams } from 'src/features/transactions/transfer/useTransferTransactionRequest'
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { isNativeCurrencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

type Params = {
  transferTokenParams: TransferTokenParams
  txRequest: providers.TransactionRequest
}

export function* transferToken(params: Params) {
  const { transferTokenParams, txRequest } = params
  const { txId, account, chainId } = transferTokenParams
  const typeInfo = getTransferTypeInfo(transferTokenParams)
  yield* call(validateTransfer, transferTokenParams)
  yield* call(sendTransaction, {
    txId,
    chainId,
    account,
    options: { request: txRequest },
    typeInfo,
  })

  logger.debug('transferToken', '', 'Transfer complete')
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

export function* validateTransfer(transferTokenParams: TransferTokenParams) {
  const { type, chainId, tokenAddress, account } = transferTokenParams
  const contractManager = yield* call(getContractManager)
  const provider = yield* call(getProvider, chainId)

  switch (type) {
    case AssetType.ERC1155: {
      const erc1155Contract = contractManager.getOrCreateContract<Erc1155>(
        chainId,
        tokenAddress,
        provider,
        ERC1155_ABI
      )

      const balance = yield* call(
        erc1155Contract.balanceOf,
        account.address,
        transferTokenParams.tokenId
      )

      validateTransferAmount('1', balance)
      return
    }
    case AssetType.ERC721: {
      const erc721Contract = contractManager.getOrCreateContract<Erc721>(
        chainId,
        tokenAddress,
        provider,
        ERC721_ABI
      )
      const balance = yield* call(erc721Contract.balanceOf, account.address)
      validateTransferAmount('1', balance)
      return
    }
    case AssetType.Currency: {
      if (isNativeCurrencyAddress(chainId, tokenAddress)) {
        const balance = yield* call([provider, provider.getBalance], account.address)
        validateTransferAmount(transferTokenParams.amountInWei, balance)
        return
      }

      const tokenContract = contractManager.getOrCreateContract<Erc20>(
        chainId,
        tokenAddress,
        provider,
        ERC20_ABI
      )
      const currentBalance = yield* call(tokenContract.balanceOf, account.address)
      validateTransferAmount(transferTokenParams.amountInWei, currentBalance)
    }
  }
}

function getTransferTypeInfo(params: TransferTokenParams) {
  const { type: assetType, toAddress, tokenAddress } = params
  const typeInfo: SendTokenTransactionInfo = {
    assetType,
    recipient: toAddress,
    tokenAddress,
    type: TransactionType.Send,
  }

  if (assetType === AssetType.ERC721 || assetType === AssetType.ERC1155) {
    typeInfo.tokenId = params.tokenId
  } else if (assetType === AssetType.Currency) {
    typeInfo.currencyAmountRaw = params.amountInWei
  }

  return typeInfo
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<Params>(transferToken, 'transferToken')
