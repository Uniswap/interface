import { call } from '@redux-saga/core/effects'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { FeeInfo, FeeType } from 'src/features/gas/types'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import {
  setTxGasParamsAndHexifyValues,
  TransferCurrencyParams,
  TransferNFTParams,
  transferToken,
} from 'src/features/transactions/transfer/transferTokenSaga'
import { SendTokenTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { account, mockContractManager, mockProvider, txRequest } from 'src/test/fixtures'

const feeInfo: FeeInfo = {
  type: FeeType.Eip1559,
  gasLimit: '100000',
  fee: {
    fast: '14508243138800000',
    normal: '14375759517700000',
    urgent: '14639580260700000',
  },
  feeDetails: {
    currentBaseFeePerGas: '120281423397',
    maxBaseFeePerGas: '142082431388',
    maxPriorityFeePerGas: {
      fast: '3000000000',
      normal: '1675163789',
      urgent: '4313371219',
    },
  },
}

const erc20TranferParams: TransferCurrencyParams = {
  txId: '1',
  type: AssetType.Currency,
  account: account,
  tokenAddress: DAI.address,
  chainId: ChainId.Rinkeby,
  toAddress: '0xdefaced',
  amountInWei: '100000000000000000',
  feeInfo,
}
const nativeTranferParams: TransferCurrencyParams = {
  ...erc20TranferParams,
  tokenAddress: NATIVE_ADDRESS,
}
const erc721TransferParams: TransferNFTParams = {
  txId: '1',
  type: AssetType.ERC721,
  chainId: ChainId.Rinkeby,
  account: account,
  toAddress: '0xdefaced',
  tokenAddress: '0xdeadbeef',
  tokenId: '123567',
  feeInfo,
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
    const rawTx = {
      from: account.address,
      to: nativeTranferParams.toAddress,
      value: nativeTranferParams.amountInWei,
    }

    if (!nativeTranferParams.feeInfo) throw new Error('missing fee info')
    const tx = setTxGasParamsAndHexifyValues(rawTx, nativeTranferParams.feeInfo)
    await expectSaga(transferToken, nativeTranferParams)
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

    if (!params.feeInfo) throw new Error('missing fee info')
    const tx = setTxGasParamsAndHexifyValues(txRequest, params.feeInfo)
    await expectSaga(transferToken, params)
      .provide([
        [call(getProvider, erc20TranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc20TranferParams.chainId,
        account: erc20TranferParams.account,
        options: { request: tx },
        typeInfo,
        txId: '1',
      })
      .silentRun()
  })
  it('Transfers ERC721', async () => {
    if (!erc721TransferParams.feeInfo) throw new Error('missing fee info')
    const tx = setTxGasParamsAndHexifyValues(txRequest, erc721TransferParams.feeInfo)
    await expectSaga(transferToken, erc721TransferParams)
      .provide([
        [call(getProvider, erc721TransferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: erc721TransferParams.chainId,
        account: erc721TransferParams.account,
        options: { request: tx },
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
    if (!erc1155TransferParams.feeInfo) throw new Error('missing fee info')
    const gasSettings = setTxGasParamsAndHexifyValues(txRequest, erc1155TransferParams.feeInfo)
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
          request: { ...txRequest, ...gasSettings },
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
    await expectSaga(transferToken, nativeTranferParams)
      .provide([
        [call(getProvider, nativeTranferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .throws(new Error('Insufficient balance'))
      .silentRun()
  })
})
