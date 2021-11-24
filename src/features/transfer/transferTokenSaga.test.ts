import { BigNumber } from '@ethersproject/bignumber'
import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { transferToken } from 'src/features/transfer/transferTokenSaga'
import { AccountType } from 'src/features/wallet/accounts/types'

describe('transferTokenSaga', () => {
  it('Transfers tokens', async () => {
    // TODO generalize utils for creating these
    const mockSigner = {
      signTransaction: jest.fn(() => '0x1234567890abcdef'),
    }
    const mockAccounts = {
      getAccount: jest.fn(() => ({
        type: AccountType.local,
        signer: mockSigner,
      })),
    }
    const mockProvider = {
      getProvider: jest.fn(() => ({
        getGasPrice: jest.fn(() => BigNumber.from('100000000000')),
        getTransactionCount: jest.fn(() => 1000),
        estimateGas: jest.fn(() => BigNumber.from('30000')),
        sendTransaction: jest.fn(() => ({ hash: '0xabcdef' })),
      })),
    }

    await expectSaga(transferToken, {
      account: {
        type: AccountType.local,
        address: NULL_ADDRESS,
        name: 'myAccount',
      },
      tokenAddress: NULL_ADDRESS,
      amount: '1.0',
      toAddress: NULL_ADDRESS,
    })
      .provide([
        [call(getWalletAccounts), mockAccounts],
        [call(getWalletProviders), mockProvider],
      ])
      .run()
  })
})
