import { select } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { type DappInfo, dappStore } from 'src/app/features/dapp/store'
import { saveAccount } from 'src/app/features/dappRequests/accounts'
import { type SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { type Account } from 'wallet/src/features/wallet/accounts/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { ACCOUNT, ACCOUNT2 } from 'wallet/src/test/fixtures'

const SENDER_TAB_INFO: SenderTabInfo = {
  id: 1,
  url: 'https://app.uniswap.org/swap',
  favIconUrl: 'https://app.uniswap.org/favicon.ico',
}
const DAPP_URL = extractBaseUrl(SENDER_TAB_INFO.url)
const PROVIDER_URL = 'https://rpc.example/'

function getProviders({
  activeAccount,
  dappInfo,
  orderedAddresses,
}: {
  activeAccount: Account
  dappInfo: DappInfo | undefined
  orderedAddresses: Address[]
}): StaticProvider[] {
  return [
    [select(selectActiveAccount), activeAccount],
    [matchers.call.fn(getEnabledChainIdsSaga), { defaultChainId: UniverseChainId.Mainnet }],
    [matchers.call.fn(dappStore.getDappInfo), dappInfo],
    [matchers.call.fn(getProvider), { connection: { url: PROVIDER_URL } }],
    [matchers.call.fn(saveDappConnection), undefined],
    [matchers.call.fn(dappStore.getDappOrderedConnectedAddresses), orderedAddresses],
  ]
}

describe('saveAccount', () => {
  // Security regression: a dapp connected only to Account A must not be able to silently absorb the
  // extension's active Account B via an auto-confirmed eth_requestAccounts / wallet_requestPermissions.
  it('does not expand an already-connected origin to the unapproved active account', async () => {
    const dappInfo: DappInfo = {
      lastChainId: UniverseChainId.Mainnet,
      connectedAccounts: [ACCOUNT],
      activeConnectedAddress: ACCOUNT.address,
    }

    const { returnValue } = await expectSaga(saveAccount, SENDER_TAB_INFO)
      .provide(getProviders({ activeAccount: ACCOUNT2, dappInfo, orderedAddresses: [ACCOUNT.address] }))
      .not.call.fn(saveDappConnection)
      .run()

    // Only the already-approved account is returned to the dapp; Account B was never added.
    expect(returnValue).toEqual({
      dappUrl: DAPP_URL,
      connectedAddresses: [ACCOUNT.address],
      chainId: UniverseChainId.Mainnet,
      providerUrl: PROVIDER_URL,
    })
  })

  it('persists the connection when the active account is already approved for the origin', async () => {
    const dappInfo: DappInfo = {
      lastChainId: UniverseChainId.Mainnet,
      connectedAccounts: [ACCOUNT, ACCOUNT2],
      activeConnectedAddress: ACCOUNT.address,
    }

    await expectSaga(saveAccount, SENDER_TAB_INFO)
      .provide(
        getProviders({ activeAccount: ACCOUNT2, dappInfo, orderedAddresses: [ACCOUNT2.address, ACCOUNT.address] }),
      )
      .call.fn(saveDappConnection)
      .run()
  })

  it('saves the connection and notifies on a first-time connection', async () => {
    await expectSaga(saveAccount, SENDER_TAB_INFO)
      .provide(getProviders({ activeAccount: ACCOUNT, dappInfo: undefined, orderedAddresses: [ACCOUNT.address] }))
      .call.fn(saveDappConnection)
      .put(pushNotification({ type: AppNotificationType.DappConnected, dappIconUrl: SENDER_TAB_INFO.favIconUrl }))
      .run()
  })
})
