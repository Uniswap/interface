import { BigNumber, BigNumberish, providers } from 'ethers'
import { call } from 'typed-redux-saga'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import ERC721_ABI from 'uniswap/src/abis/erc721.json'
import ERC1155_ABI from 'uniswap/src/abis/erc1155.json'
import { Erc20, Erc721, Erc1155 } from 'uniswap/src/abis/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  SendTokenTransactionInfo,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { SendTokenParams } from 'wallet/src/features/transactions/send/types'
import { getContractManager, getProvider } from 'wallet/src/features/wallet/context'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

type Params = {
  sendTokenParams: SendTokenParams
  txRequest: providers.TransactionRequest
}

export function* sendToken(params: Params) {
  try {
    const { sendTokenParams, txRequest } = params
    const { txId, account, chainId } = sendTokenParams
    const typeInfo = getSendTypeInfo(sendTokenParams)

    yield* call(validateSend, sendTokenParams)
    yield* call(executeTransaction, {
      txId,
      chainId,
      account,
      options: { request: txRequest },
      typeInfo,
      transactionOriginType: TransactionOriginType.Internal,
    })

    const amountUSD = params.sendTokenParams.currencyAmountUSD
      ? parseFloat(params.sendTokenParams.currencyAmountUSD.toFixed(2))
      : undefined

    sendAnalyticsEvent(WalletEventName.TransferSubmitted, {
      chainId: params.sendTokenParams.chainId,
      tokenAddress: params.sendTokenParams.tokenAddress,
      toAddress: params.sendTokenParams.toAddress,
      amountUSD,
    })
    logger.debug('transferTokenSaga', 'transferToken', 'Transfer submitted')
  } catch (error) {
    yield* call(logger.error, error, {
      tags: { file: 'transferTokenSaga', function: 'transferToken' },
    })
  }
}

function validateSendAmount(amountInWei: string, currentBalance: BigNumberish): void {
  const amount = BigNumber.from(amountInWei)
  if (amount.lte(0)) {
    throw new Error('Invalid transfer amount')
  }
  if (BigNumber.from(amountInWei).gt(currentBalance)) {
    throw new Error('Balance insufficient for transfer')
  }
}

function* validateSend(sendTokenParams: SendTokenParams) {
  const { type, chainId, tokenAddress, account } = sendTokenParams
  const contractManager = yield* call(getContractManager)
  const provider = yield* call(getProvider, chainId)

  switch (type) {
    case AssetType.ERC1155: {
      const erc1155Contract = contractManager.getOrCreateContract<Erc1155>({
        chainId,
        address: tokenAddress,
        provider,
        ABI: ERC1155_ABI,
      })

      const balance = yield* call(erc1155Contract.balanceOf, account.address, sendTokenParams.tokenId)

      validateSendAmount('1', balance)
      return
    }
    case AssetType.ERC721: {
      const erc721Contract = contractManager.getOrCreateContract<Erc721>({
        chainId,
        address: tokenAddress,
        provider,
        ABI: ERC721_ABI,
      })
      const balance = yield* call(erc721Contract.balanceOf, account.address)
      validateSendAmount('1', balance)
      return
    }
    case AssetType.Currency: {
      if (isNativeCurrencyAddress(chainId, tokenAddress)) {
        const balance = yield* call([provider, provider.getBalance], account.address)
        validateSendAmount(sendTokenParams.amountInWei, balance)
        return
      }

      const tokenContract = contractManager.getOrCreateContract<Erc20>({
        chainId,
        address: tokenAddress,
        provider,
        ABI: ERC20_ABI,
      })
      const currentBalance = yield* call(tokenContract.balanceOf, account.address)
      validateSendAmount(sendTokenParams.amountInWei, currentBalance)
    }
  }
}

function getSendTypeInfo(params: SendTokenParams): SendTokenTransactionInfo {
  const { type: assetType, toAddress, tokenAddress, currencyAmountUSD, gasEstimate } = params
  const typeInfo: SendTokenTransactionInfo = {
    assetType,
    recipient: toAddress,
    tokenAddress,
    type: TransactionType.Send,
    currencyAmountUSD,
    gasEstimate,
  }

  if (assetType === AssetType.ERC721 || assetType === AssetType.ERC1155) {
    typeInfo.tokenId = params.tokenId
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (assetType === AssetType.Currency) {
    typeInfo.currencyAmountRaw = params.amountInWei
  }

  return typeInfo
}

export const {
  name: sendTokenSagaName,
  wrappedSaga: sendTokenSaga,
  reducer: sendTokenReducer,
  actions: sendTokenActions,
} = createMonitoredSaga({
  saga: sendToken,
  name: 'sendToken',
})
