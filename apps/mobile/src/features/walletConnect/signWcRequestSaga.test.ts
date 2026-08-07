import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { signWcRequestActions, signWcRequestSaga } from 'src/features/walletConnect/signWcRequestSaga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { getSignerManager } from 'wallet/src/features/wallet/context'

vi.mock('src/features/walletConnect/walletConnectClient', () => ({
  wcWeb3Wallet: { respondSessionRequest: vi.fn() },
}))

const ACCOUNT = {
  address: '0x1111111111111111111111111111111111111111',
  type: AccountType.SignerMnemonic,
} as const

// The chain executeTransaction runs on must come from the session, not from the dapp's own
// transaction object. Deriving it from params.transaction.chainId made the service-level assert
// compare the dapp's value against itself.
describe('signWcRequest transaction chain binding', () => {
  function triggerTransaction(transactionChainId?: number) {
    return signWcRequestActions.trigger({
      sessionId: 'session-1',
      requestInternalId: 'req-1',
      method: EthMethod.EthSendTransaction,
      account: ACCOUNT,
      chainId: UniverseChainId.Optimism,
      dappRequestInfo: { name: 'Dapp', url: 'https://dapp.example', icon: null },
      transaction: {
        to: '0x2222222222222222222222222222222222222222',
        from: ACCOUNT.address,
        ...(transactionChainId === undefined ? {} : { chainId: transactionChainId }),
      },
      request: { type: EthMethod.EthSendTransaction },
    } as unknown as Parameters<typeof signWcRequestActions.trigger>[0])
  }

  const providers = [
    [matchers.call.fn(getSignerManager), {}],
    [matchers.call.fn(executeTransaction), { transactionHash: '0xhash' }],
  ] as const

  it('executes on the session chain, not the chain the dapp put on the transaction', async () => {
    const { effects } = await expectSaga(signWcRequestSaga)
      .provide(providers as never)
      .dispatch(triggerTransaction(UniverseChainId.Mainnet))
      .silentRun()

    const executeCall = effects.call.find((effect) => effect.payload.args[0]?.options?.request)
    expect(executeCall?.payload.args[0].chainId).toBe(UniverseChainId.Optimism)
  })

  it('executes on the session chain when the transaction carries none', async () => {
    const { effects } = await expectSaga(signWcRequestSaga)
      .provide(providers as never)
      .dispatch(triggerTransaction())
      .silentRun()

    const executeCall = effects.call.find((effect) => effect.payload.args[0]?.options?.request)
    expect(executeCall?.payload.args[0].chainId).toBe(UniverseChainId.Optimism)
  })
})
