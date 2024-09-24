import { call } from '@redux-saga/core/effects'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DAI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  SendTokenTransactionInfo,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getTxFixtures } from 'uniswap/src/test/fixtures'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { noOpFunction } from 'utilities/src/test/utils'
import { sendToken } from 'wallet/src/features/transactions/send/sendTokenSaga'
import { SendCurrencyParams, SendNFTParams } from 'wallet/src/features/transactions/send/types'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getContractManager, getProvider } from 'wallet/src/features/wallet/context'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks, mockContractManager } from 'wallet/src/test/mocks'

jest.mock('uniswap/src/features/telemetry/send')

const account = signerMnemonicAccount()

const { txRequest, ethersTxReceipt } = getTxFixtures()
const { mockProvider } = getTxProvidersMocks(ethersTxReceipt)

const erc20TranferParams: SendCurrencyParams = {
  txId: '1',
  type: AssetType.Currency,
  account,
  tokenAddress: DAI.address,
  chainId: UniverseChainId.Goerli,
  toAddress: '0xdefaced',
  amountInWei: '100000000000000000',
  currencyAmountUSD: undefined,
}
const nativeTranferParams: SendCurrencyParams = {
  ...erc20TranferParams,
  tokenAddress: getNativeAddress(UniverseChainId.Goerli),
}
const erc721TransferParams: SendNFTParams = {
  txId: '1',
  type: AssetType.ERC721,
  chainId: UniverseChainId.Goerli,
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
  currencyAmountRaw: erc20TranferParams.amountInWei,
  recipient: erc20TranferParams.toAddress,
  tokenAddress: erc20TranferParams.tokenAddress,
  type: TransactionType.Send,
  currencyAmountUSD: undefined,
  gasEstimates: undefined,
}

describe('sendTokenSaga', () => {
  it('Transfers native currency', async () => {
    const tx = {
      from: account.address,
      to: nativeTranferParams.toAddress,
      value: nativeTranferParams.amountInWei,
    }

    await expectSaga(sendToken, {
      sendTokenParams: nativeTranferParams,
      txRequest: tx,
    })
      .provide([
        [call(getProvider, nativeTranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
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

    await expectSaga(sendToken, {
      sendTokenParams: params,
      txRequest,
    })
      .provide([
        [call(getProvider, erc20TranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        transactionOriginType: TransactionOriginType.Internal,
        chainId: erc20TranferParams.chainId,
        account: erc20TranferParams.account,
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
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
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
          gasEstimates: undefined,
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
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
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
          gasEstimates: undefined,
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
      sendTokenParams: nativeTranferParams,
      txRequest,
    })
      .provide([
        [call(getProvider, nativeTranferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .silentRun()
  })
})
