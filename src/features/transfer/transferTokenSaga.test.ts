import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { getProviderManager, getSignerManager } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { transferToken } from 'src/features/transfer/transferTokenSaga'
import { account, mockProviderManager, mockSignerManager } from 'src/test/fixtures'

describe('transferTokenSaga', () => {
  it('Transfers tokens', async () => {
    await expectSaga(transferToken, {
      account,
      tokenAddress: NULL_ADDRESS,
      amount: '1.0',
      toAddress: NULL_ADDRESS,
    })
      .provide([
        [call(getSignerManager), mockSignerManager],
        [call(getProviderManager), mockProviderManager],
      ])
      .run()
  })
})
