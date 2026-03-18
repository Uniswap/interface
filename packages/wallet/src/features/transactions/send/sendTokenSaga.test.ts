import { BigNumber } from '@ethersproject/bignumber'
import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DAI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  SendTokenTransactionInfo,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getTxFixtures } from 'uniswap/src/test/fixtures'
import { noOpFunction } from 'utilities/src/test/utils'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { sendToken } from 'wallet/src/features/transactions/send/sendTokenSaga'
import { SendCurrencyParams, SendNFTParams } from 'wallet/src/features/transactions/send/types'
import { getContractManager, getProvider } from 'wallet/src/features/wallet/context'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks, mockContractManager } from 'wallet/src/test/mocks'

jest.mock('uniswap/src/features/telemetry/send')

const account = signerMnemonicAccount()

const { txRequest, ethersTxReceipt } = getTxFixtures()
const { mockProvider } = getTxProvidersMocks(ethersTxReceipt)

const erc20TransferParams: SendCurrencyParams = {
  txId: '1',
  type: AssetType.Currency,
  account,
  tokenAddress: DAI.address,
  chainId: UniverseChainId.Mainnet,
  toAddress: '0xdefaced',
  amountInWei: '100000000000000000',
  currencyAmountUSD: undefined,
}
const nativeTransferParams: SendCurrencyParams = {
  ...erc20TransferParams,
  tokenAddress: getNativeAddress(UniverseChainId.Mainnet),
}
const erc721TransferParams: SendNFTParams = {
  txId: '1',
  type: AssetType.ERC721,
  chainId: UniverseChainId.Mainnet,
  account,
  toAddress: '0xdefaced',
  tokenAddress: '0xdeadbeef',
  tokenId: '123567',
  currencyAmountUSD: undefined,
}
const erc1155TransferParams: SendNFTParams = {
  ...erc721TransferParams,
  type: AssetType.ERC1155,
}

const typeInfo: SendTokenTransactionInfo = {
  assetType: AssetType.Currency,
  currencyAmountRaw: erc20TransferParams.amountInWei,
  recipient: erc20TransferParams.toAddress,
  tokenAddress: erc20TransferParams.tokenAddress,
  type: TransactionType.Send,
  currencyAmountUSD: undefined,
  gasEstimate: undefined,
}

describe('sendTokenSaga', () => {
  it('Transfers native currency', async () => {
    const tx = {
      from: account.address,
      to: nativeTransferParams.toAddress,
      value: nativeTransferParams.amountInWei,
    }

    await expectSaga(sendToken, {
      sendTokenParams: nativeTransferParams,
      txRequest: tx,
    })
      .provide([
        [call(getProvider, nativeTransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(executeTransaction), true],
      ])
      .call(executeTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
        chainId: nativeTransferParams.chainId,
        account: nativeTransferParams.account,
        options: { request: tx },
        typeInfo: {
          ...typeInfo,
          tokenAddress: nativeTransferParams.tokenAddress,
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers token currency', async () => {
    const params = {
      ...erc20TransferParams,
      tokenAddress: DAI.address,
    }

    await expectSaga(sendToken, {
      sendTokenParams: params,
      txRequest,
    })
      .provide([
        [call(getProvider, erc20TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(executeTransaction), true],
      ])
      .call(executeTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
        chainId: erc20TransferParams.chainId,
        account: erc20TransferParams.account,
        options: { request: txRequest },
        typeInfo,
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers ERC721', async () => {
    await expectSaga(sendToken, { sendTokenParams: erc721TransferParams, txRequest })
      .provide([
        [call(getProvider, erc721TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(executeTransaction), true],
      ])
      .call(executeTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
        chainId: erc721TransferParams.chainId,
        account: erc721TransferParams.account,
        options: { request: txRequest },
        typeInfo: {
          assetType: AssetType.ERC721,
          recipient: erc721TransferParams.toAddress,
          tokenAddress: erc721TransferParams.tokenAddress,
          tokenId: erc721TransferParams.tokenId,
          type: TransactionType.Send,
          currencyAmountUSD: undefined,
          gasEstimate: undefined,
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers ERC1155', async () => {
    await expectSaga(sendToken, { sendTokenParams: erc1155TransferParams, txRequest })
      .provide([
        [call(getProvider, erc1155TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(executeTransaction), true],
      ])
      .call(executeTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
        chainId: erc1155TransferParams.chainId,
        account: erc1155TransferParams.account,
        options: {
          request: txRequest,
        },
        typeInfo: {
          assetType: AssetType.ERC1155,
          recipient: erc1155TransferParams.toAddress,
          tokenAddress: erc1155TransferParams.tokenAddress,
          tokenId: erc1155TransferParams.tokenId,
          type: TransactionType.Send,
          currencyAmountUSD: undefined,
          gasEstimate: undefined,
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Fails on insufficient balance', async () => {
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    const provider = {
      ...mockProvider,
      getBalance: jest.fn(() => BigNumber.from('0')),
    }
    await expectSaga(sendToken, {
      sendTokenParams: nativeTransferParams,
      txRequest,
    })
      .provide([
        [call(getProvider, nativeTransferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .silentRun()
  })
})
