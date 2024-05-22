import { call } from '@redux-saga/core/effects'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI } from 'wallet/src/constants/tokens'
import { AssetType } from 'wallet/src/entities/assets'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { transferToken } from 'wallet/src/features/transactions/transfer/transferTokenSaga'
import {
  TransferCurrencyParams,
  TransferNFTParams,
} from 'wallet/src/features/transactions/transfer/types'
import { SendTokenTransactionInfo, TransactionType } from 'wallet/src/features/transactions/types'
import { getContractManager, getProvider } from 'wallet/src/features/wallet/context'
import { getTxFixtures, signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks, mockContractManager } from 'wallet/src/test/mocks'

const account = signerMnemonicAccount()

const { txRequest, ethersTxReceipt } = getTxFixtures()
const { mockProvider } = getTxProvidersMocks(ethersTxReceipt)

const erc20TranferParams: TransferCurrencyParams = {
  txId: '1',
  type: AssetType.Currency,
  account,
  tokenAddress: DAI.address,
  chainId: ChainId.Goerli,
  toAddress: '0xdefaced',
  amountInWei: '100000000000000000',
}
const nativeTranferParams: TransferCurrencyParams = {
  ...erc20TranferParams,
  tokenAddress: getNativeAddress(ChainId.Goerli),
}
const erc721TransferParams: TransferNFTParams = {
  txId: '1',
  type: AssetType.ERC721,
  chainId: ChainId.Goerli,
  account,
  toAddress: '0xdefaced',
  tokenAddress: '0xdeadbeef',
  tokenId: '123567',
}
const erc1155TransferParams: TransferNFTParams = {
  ...erc721TransferParams,
  type: AssetType.ERC1155,
}

const typeInfo: SendTokenTransactionInfo = {
  assetType: AssetType.Currency,
  currencyAmountRaw: erc20TranferParams.amountInWei,
  recipient: erc20TranferParams.toAddress,
  tokenAddress: erc20TranferParams.tokenAddress,
  type: TransactionType.Send,
}

describe('transferTokenSaga', () => {
  it('Transfers native currency', async () => {
    const tx = {
      from: account.address,
      to: nativeTranferParams.toAddress,
      value: nativeTranferParams.amountInWei,
    }

    await expectSaga(transferToken, {
      transferTokenParams: nativeTranferParams,
      txRequest: tx,
    })
      .provide([
        [call(getProvider, nativeTranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: nativeTranferParams.chainId,
        account: nativeTranferParams.account,
        options: { request: tx },
        typeInfo: {
          ...typeInfo,
          tokenAddress: nativeTranferParams.tokenAddress,
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers token currency', async () => {
    const params = {
      ...erc20TranferParams,
      tokenAddress: DAI.address,
    }

    await expectSaga(transferToken, {
      transferTokenParams: params,
      txRequest,
    })
      .provide([
        [call(getProvider, erc20TranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc20TranferParams.chainId,
        account: erc20TranferParams.account,
        options: { request: txRequest },
        typeInfo,
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers ERC721', async () => {
    await expectSaga(transferToken, { transferTokenParams: erc721TransferParams, txRequest })
      .provide([
        [call(getProvider, erc721TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc721TransferParams.chainId,
        account: erc721TransferParams.account,
        options: { request: txRequest },
        typeInfo: {
          assetType: AssetType.ERC721,
          recipient: erc721TransferParams.toAddress,
          tokenAddress: erc721TransferParams.tokenAddress,
          tokenId: erc721TransferParams.tokenId,
          type: TransactionType.Send,
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers ERC1155', async () => {
    await expectSaga(transferToken, { transferTokenParams: erc1155TransferParams, txRequest })
      .provide([
        [call(getProvider, erc1155TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
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
        },
        txId: '1',
      })
      .silentRun()
  })
  it('Fails on insufficient balance', async () => {
    const provider = {
      ...mockProvider,
      getBalance: jest.fn(() => BigNumber.from('0')),
    }
    await expectSaga(transferToken, {
      transferTokenParams: nativeTranferParams,
      txRequest,
    })
      .provide([
        [call(getProvider, nativeTranferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .silentRun()
  })
})
