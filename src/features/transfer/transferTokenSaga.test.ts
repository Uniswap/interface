import { call } from '@redux-saga/core/effects'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { TransactionType, TransactionTypeInfo } from 'src/features/transactions/types'
import { transferToken } from 'src/features/transfer/transferTokenSaga'
import { TransferTokenParams } from 'src/features/transfer/types'
import { account, mockContractManager, mockProvider, txRequest } from 'src/test/fixtures'

const tranferParams: TransferTokenParams = {
  account,
  tokenAddress: NATIVE_ADDRESS,
  chainId: ChainId.Rinkeby,
  toAddress: account.address,
  amountInWei: '100000000000000000',
}

const typeInfo: TransactionTypeInfo = {
  type: TransactionType.Send,
  currencyAmountRaw: tranferParams.amountInWei,
}

describe('transferTokenSaga', () => {
  it('Transfers native currency', async () => {
    await expectSaga(transferToken, tranferParams)
      .provide([
        [call(getProvider, tranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: tranferParams.chainId,
        account: tranferParams.account,
        options: {
          request: {
            from: account.address,
            to: tranferParams.toAddress,
            value: tranferParams.amountInWei,
          },
          fetchBalanceOnSuccess: true,
        },
        typeInfo,
      })
      .silentRun()
  })
  it('Transfers token currency', async () => {
    const params = {
      ...tranferParams,
      tokenAddress: DAI.address,
    }
    await expectSaga(transferToken, params)
      .provide([
        [call(getProvider, tranferParams.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
        [matchers.call.fn(sendTransaction), true],
      ])
      .call(sendTransaction, {
        chainId: tranferParams.chainId,
        account: tranferParams.account,
        options: {
          request: txRequest,
          fetchBalanceOnSuccess: true,
        },
        typeInfo,
      })
      .silentRun()
  })
  it('Fails on insufficient balance', async () => {
    const provider = {
      ...mockProvider,
      getBalance: jest.fn(() => BigNumber.from('0')),
    }
    await expectSaga(transferToken, tranferParams)
      .provide([
        [call(getProvider, tranferParams.chainId), provider],
        [call(getContractManager), mockContractManager],
      ])
      .throws(new Error('Insufficient balance'))
      .silentRun()
  })
})
