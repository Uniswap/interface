import { BigNumber, BigNumberish, providers } from 'ethers'
import ERC1155_ABI from 'src/abis/erc1155.json'
import ERC20_ABI from 'src/abis/erc20.json'
import ERC721_ABI from 'src/abis/erc721.json'
import { Erc1155, Erc20, Erc721 } from 'src/abis/types'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { AssetType, NFTAssetType } from 'src/entities/assets'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { FeeInfo } from 'src/features/gas/types'
import { getTxGasSettings } from 'src/features/gas/utils'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { formatAsHexString } from 'src/features/transactions/swap/utils'
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { isNativeCurrencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

interface BaseTransferParams {
  type: AssetType
  txId?: string
  account: Account
  chainId: ChainId
  toAddress: Address
  tokenAddress: Address
  feeInfo?: FeeInfo
}

export interface TransferCurrencyParams extends BaseTransferParams {
  type: AssetType.Currency
  amountInWei: string
}

export interface TransferNFTParams extends BaseTransferParams {
  type: NFTAssetType
  tokenId: string
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams

export function* transferToken(params: TransferTokenParams) {
  const { txId, account, chainId } = params

  const { transferTxRequest, typeInfo } = yield* call(prepareTransfer, params)

  yield* call(sendTransaction, {
    txId,
    chainId,
    account,
    options: { request: transferTxRequest },
    typeInfo,
  })

  logger.debug('transferToken', '', 'Transfer complete')
}

export function* prepareTransfer(
  params: TransferTokenParams,
  prepareForEstimation: boolean = false
) {
  const { chainId, type: assetType, tokenAddress, feeInfo } = params

  const provider = yield* call(getProvider, chainId)
  const contractManager = yield* call(getContractManager)

  let transferTxRequest: providers.TransactionRequest
  const typeInfo: SendTokenTransactionInfo = {
    assetType,
    recipient: params.toAddress,
    tokenAddress,
    type: TransactionType.Send,
  }

  switch (assetType) {
    case AssetType.ERC1155:
    case AssetType.ERC721:
      transferTxRequest = yield* call(prepareNFTTransfer, params, provider, contractManager)
      typeInfo.tokenId = params.tokenId
      break
    case AssetType.Currency:
      typeInfo.currencyAmountRaw = params.amountInWei
      if (isNativeCurrencyAddress(tokenAddress)) {
        transferTxRequest = yield* call(prepareNativeTransfer, params, provider)
      } else {
        transferTxRequest = yield* call(prepareTokenTransfer, params, provider, contractManager)
      }

      break
  }

  // feeInfo will be undefined when prepareTransfer is called in estimateTransferGasFee
  // if prepareTransfer is not being called as part of the estimation saga, then feeInfo should always be defined
  if (!prepareForEstimation) {
    if (!feeInfo) {
      throw new Error('No fee info provided for transfer')
    }
    transferTxRequest = setTxGasParamsAndHexifyValues(transferTxRequest, feeInfo)
  }

  return { transferTxRequest, typeInfo }
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
    amountInWei,
    { from: account.address }
  )
  return transactionRequest
}

async function prepareNFTTransfer(
  params: TransferNFTParams,
  provider: providers.Provider,
  contractManager: ContractManager
) {
  const { chainId, account, toAddress, tokenAddress, tokenId } = params

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

export function setTxGasParamsAndHexifyValues(
  transferTxRequest: providers.TransactionRequest,
  feeInfo: FeeInfo
) {
  const gasSettings = getTxGasSettings(feeInfo)
  const value = transferTxRequest.value
    ? formatAsHexString(transferTxRequest.value.toString())
    : undefined
  const nonce = transferTxRequest.nonce
    ? formatAsHexString(transferTxRequest.nonce.toString())
    : undefined
  return { ...transferTxRequest, nonce, value, ...gasSettings }
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')
