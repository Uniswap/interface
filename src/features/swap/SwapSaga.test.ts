import { MethodParameters } from '@uniswap/v3-sdk'
import { testSaga } from 'redux-saga-test-plan'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { swap, SwapParams, _swap } from 'src/features/swap/SwapSaga'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountStub, AccountType } from 'src/features/wallet/accounts/types'

let fakeAccountManager = new AccountManager()
let fakeProviderManager = new ProviderManager()

const account: AccountStub = {
  type: AccountType.local,
  address: NULL_ADDRESS,
  name: 'Test Account',
}

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x00',
}

const params: SwapParams = { account, methodParameters }

describe(swap, () => {
  it('prepares a swap', () => {
    testSaga(swap, params)
      .next()
      .call(getWalletAccounts)
      .next(fakeAccountManager)
      .call(getWalletProviders)
      .next(fakeProviderManager)
      .call(_swap, account, methodParameters, fakeAccountManager, fakeProviderManager)
      .next()
      .isDone()
  })
})
