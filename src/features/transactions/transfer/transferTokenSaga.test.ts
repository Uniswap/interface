import { call } from '@redux-saga/core/effects'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { transferToken } from 'src/features/transactions/transfer/transferTokenSaga'
import { TransferCurrencyParams, TransferNFTParams } from 'src/features/transactions/transfer/types'
import {
  SendNFTTransactionInfo,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import { account, mockContractManager, mockProvider, txRequest } from 'src/test/fixtures'

const erc20TranferParams: TransferCurrencyParams = {
  type: AssetType.Currency,
  account: account,
  tokenAddress: DAI.address,
  chainId: ChainId.Rinkeby,
  toAddress: '0xdefaced',
  amountInWei: '100000000000000000',
}
const nativeTranferParams: TransferCurrencyParams = {
  ...erc20TranferParams,
  tokenAddress: NATIVE_ADDRESS,
}
const erc721TransferParams: TransferNFTParams = {
  type: AssetType.NFT,
  chainId: ChainId.Rinkeby,
  account: account,
  toAddress: '0xdefaced',
  tokenAddress: '0xdeadbeef',
  tokenId: '123567',
}

const typeInfo: TransactionTypeInfo = {
  type: TransactionType.Send,
  currencyAmountRaw: erc20TranferParams.amountInWei,
}
const nftTypeInfo: SendNFTTransactionInfo = {
  type: TransactionType.Send,
}

describe('transferTokenSaga', () => {
  it('Transfers native currency', async () => {
    await expectSaga(transferToken, nativeTranferParams)
      .provide([
        [call(getProvider, nativeTranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: nativeTranferParams.chainId,
        account: nativeTranferParams.account,
        options: {
          request: {
            from: account.address,
            to: nativeTranferParams.toAddress,
            value: nativeTranferParams.amountInWei,
          },
          fetchBalanceOnSuccess: true,
        },
        typeInfo,
      })
      .silentRun()
  })
  it('Transfers token currency', async () => {
    const params = {
      ...erc20TranferParams,
      tokenAddress: DAI.address,
    }
    await expectSaga(transferToken, params)
      .provide([
        [call(getProvider, erc20TranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc20TranferParams.chainId,
        account: erc20TranferParams.account,
        options: {
          request: txRequest,
          fetchBalanceOnSuccess: true,
        },
        typeInfo,
      })
      .silentRun()
  })
  it('Transfers ERC721', async () => {
    await expectSaga(transferToken, erc721TransferParams)
      .provide([
        [call(getProvider, erc721TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc721TransferParams.chainId,
        account: erc721TransferParams.account,
        options: {
          request: txRequest,
          fetchBalanceOnSuccess: true,
        },
        typeInfo: nftTypeInfo,
      })
      .silentRun()
  })
  it('Fails on insufficient balance', async () => {
    const provider = {
      ...mockProvider,
      getBalance: jest.fn(() => BigNumber.from('0')),
    }
    await expectSaga(transferToken, nativeTranferParams)
      .provide([
        [call(getProvider, nativeTranferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .throws(new Error('Insufficient balance'))
      .silentRun()
  })
})
