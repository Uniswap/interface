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
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'
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
  type: AssetType.ERC721,
  chainId: ChainId.Rinkeby,
  account: account,
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
        typeInfo: {
          ...typeInfo,
          tokenAddress: nativeTranferParams.tokenAddress,
        },
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
        typeInfo: {
          assetType: AssetType.ERC721,
          recipient: erc721TransferParams.toAddress,
          tokenAddress: erc721TransferParams.tokenAddress,
          tokenId: erc721TransferParams.tokenId,
          type: TransactionType.Send,
        },
      })
      .silentRun()
  })
  it('Transfers ERC1155', async () => {
    await expectSaga(transferToken, erc1155TransferParams)
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
          fetchBalanceOnSuccess: true,
        },
        typeInfo: {
          assetType: AssetType.ERC1155,
          recipient: erc1155TransferParams.toAddress,
          tokenAddress: erc1155TransferParams.tokenAddress,
          tokenId: erc1155TransferParams.tokenId,
          type: TransactionType.Send,
        },
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
