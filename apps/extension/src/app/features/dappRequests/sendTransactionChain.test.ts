import { select } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { type DappInfo, dappStore } from 'src/app/features/dapp/store'
import { addRequest, rejectRequest } from 'src/app/features/dappRequests/actions'
import { dappRequestWatcher, handleSendTransaction, handleSignTypedData } from 'src/app/features/dappRequests/saga'
import { type SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { dappRequestActions } from 'src/app/features/dappRequests/slice'
import {
  EthSendTransactionRPCActions,
  type SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
import { ACCOUNT } from 'wallet/src/test/fixtures'

const SENDER_TAB_INFO: SenderTabInfo = {
  id: 1,
  url: 'https://dapp.example/swap',
  favIconUrl: 'https://dapp.example/favicon.ico',
}

const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const ATTACKER_SPENDER = '0x3333333333333333333333333333333333333333'

function dappInfoOn(chainId: UniverseChainId): DappInfo {
  return {
    lastChainId: chainId,
    connectedAccounts: [ACCOUNT],
    activeConnectedAddress: ACCOUNT.address,
  }
}

function sendTransactionRequest(chainId?: number): SendTransactionRequest {
  return {
    type: DappRequestType.SendTransaction,
    requestId: 'request-1',
    contractInteractions: EthSendTransactionRPCActions.Unknown,
    transaction: {
      from: ACCOUNT.address,
      to: PERMIT2,
      data: `0x095ea7b3${ATTACKER_SPENDER.slice(2)}`,
      value: '0x0',
      ...(chainId === undefined ? {} : { chainId }),
    },
  }
}

function intakeProviders(dappInfo: DappInfo | undefined): StaticProvider[] {
  return [
    [select(selectActiveAccount), ACCOUNT],
    [matchers.call.fn(getEnabledChainIdsSaga), { defaultChainId: UniverseChainId.Mainnet }],
    [matchers.call.fn(dappStore.getDappInfo), dappInfo],
  ]
}

// Finding 814: the chain reviewed and scanned must be the chain signed. eth_sendTransaction may
// omit chainId, which left the UI on the dapp's live chain while signing used the queued snapshot.
describe('eth_sendTransaction chain binding', () => {
  describe('intake', () => {
    it('pins a transaction that omits chainId to the connected chain', async () => {
      const dappInfo = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(dappRequestWatcher)
        .provide(intakeProviders(dappInfo))
        .dispatch(
          addRequest({
            isSidebarClosed: false,
            dappRequest: sendTransactionRequest(),
            senderTabInfo: SENDER_TAB_INFO,
          }),
        )
        .silentRun()

      const added = effects.put.find((effect) => effect.payload.action.type === dappRequestActions.add.type)
      expect(added?.payload.action.payload.dappRequest.transaction.chainId).toBe(UniverseChainId.Mainnet)
    })

    it('leaves a matching explicit chainId untouched', async () => {
      const dappInfo = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(dappRequestWatcher)
        .provide(intakeProviders(dappInfo))
        .dispatch(
          addRequest({
            isSidebarClosed: false,
            dappRequest: sendTransactionRequest(UniverseChainId.Mainnet),
            senderTabInfo: SENDER_TAB_INFO,
          }),
        )
        .silentRun()

      const added = effects.put.find((effect) => effect.payload.action.type === dappRequestActions.add.type)
      expect(added?.payload.action.payload.dappRequest.transaction.chainId).toBe(UniverseChainId.Mainnet)
    })

    // Dapps send hex per EIP-1193, so intake has to normalize before comparing.
    it('accepts a hex chainId that matches the connected chain', async () => {
      const dappInfo = dappInfoOn(UniverseChainId.Mainnet)
      const request = sendTransactionRequest()
      request.transaction.chainId = '0x1' as unknown as number

      const { effects } = await expectSaga(dappRequestWatcher)
        .provide(intakeProviders(dappInfo))
        .dispatch(addRequest({ isSidebarClosed: false, dappRequest: request, senderTabInfo: SENDER_TAB_INFO }))
        .silentRun()

      expect(effects.put.some((effect) => effect.payload.action.type === rejectRequest.type)).toBe(false)
      const added = effects.put.find((effect) => effect.payload.action.type === dappRequestActions.add.type)
      expect(added?.payload.action.payload.dappRequest.transaction.chainId).toBe(UniverseChainId.Mainnet)
    })

    it('rejects a transaction whose explicit chainId disagrees with the connected chain', async () => {
      const dappInfo = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(dappRequestWatcher)
        .provide(intakeProviders(dappInfo))
        .dispatch(
          addRequest({
            isSidebarClosed: false,
            dappRequest: sendTransactionRequest(UniverseChainId.Base),
            senderTabInfo: SENDER_TAB_INFO,
          }),
        )
        .silentRun()

      expect(effects.put.some((effect) => effect.payload.action.type === rejectRequest.type)).toBe(true)
      // A rejected request must never also reach the confirmation queue.
      expect(effects.put.some((effect) => effect.payload.action.type === dappRequestActions.add.type)).toBe(false)
    })

    // Note this is caught by the earlier isConnectedToDapp gate, not the SendTransaction block's
    // own !dappInfo branch, which is unreachable and kept only for narrowing. What matters here is
    // that an unconnected dapp gets an authorization error rather than a chain error.
    it('rejects an unconnected dapp as unauthorized, not as a chain error', async () => {
      const { effects } = await expectSaga(dappRequestWatcher)
        .provide(intakeProviders(undefined))
        .dispatch(
          addRequest({
            isSidebarClosed: false,
            dappRequest: sendTransactionRequest(),
            senderTabInfo: SENDER_TAB_INFO,
          }),
        )
        .silentRun()

      const rejection = effects.put.find((effect) => effect.payload.action.type === rejectRequest.type)
      // 4902 is "unrecognized chain"; this is an authorization failure.
      expect(rejection?.payload.action.payload.errorResponse.error.code).not.toBe(4902)
      expect(effects.put.some((effect) => effect.payload.action.type === dappRequestActions.add.type)).toBe(false)
    })
  })

  describe('confirmation', () => {
    const confirmProviders = (currentDappInfo: DappInfo | undefined): StaticProvider[] => [
      [matchers.call.fn(dappStore.getDappInfo), currentDappInfo],
      [
        matchers.call.fn(getProvider),
        // handleSendTransaction kicks off onTransactionSentToChain without awaiting it.
        { connection: { url: 'https://rpc.example/' }, waitForTransaction: async () => ({ status: 1 }) },
      ],
      [matchers.call.fn(executeTransaction), { transactionHash: '0xhash' }],
      [matchers.call.fn(getEnabledChainIdsSaga), { defaultChainId: UniverseChainId.Mainnet, platform: Platform.EVM }],
    ]

    it('signs on the reviewed chain when the dapp has not moved', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      await expectSaga(handleSendTransaction, {
        request: sendTransactionRequest(UniverseChainId.Mainnet),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
      })
        .provide(confirmProviders(reviewed))
        .call.fn(executeTransaction)
        .silentRun()
    })

    it('refuses to sign when the dapp switched chains while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      await expect(
        expectSaga(handleSendTransaction, {
          request: sendTransactionRequest(UniverseChainId.Mainnet),
          senderTabInfo: SENDER_TAB_INFO,
          dappInfo: reviewed,
        })
          .provide(confirmProviders(dappInfoOn(UniverseChainId.Base)))
          .not.call.fn(executeTransaction)
          .silentRun(),
      ).rejects.toThrow('Dapp changed chains while this request was pending')
    })

    it('refuses to sign when the dapp disconnected while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      await expect(
        expectSaga(handleSendTransaction, {
          request: sendTransactionRequest(UniverseChainId.Mainnet),
          senderTabInfo: SENDER_TAB_INFO,
          dappInfo: reviewed,
        })
          .provide(confirmProviders(undefined))
          .not.call.fn(executeTransaction)
          .silentRun(),
      ).rejects.toThrow('Dapp disconnected while this request was pending')
    })

    // Same staleness window as transactions.
    it('refuses to sign typed data when the dapp switched chains while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)
      const typedData = JSON.stringify({
        types: { EIP712Domain: [], PermitSingle: [] },
        primaryType: 'PermitSingle',
        domain: { name: 'Permit2', chainId: UniverseChainId.Mainnet, verifyingContract: PERMIT2 },
        message: { spender: ATTACKER_SPENDER },
      })

      // handleSignTypedData reports failure by rejecting the request rather than rethrowing.
      const { effects } = await expectSaga(handleSignTypedData, {
        dappRequest: {
          type: DappRequestType.SignTypedData,
          requestId: 'sig-1',
          address: ACCOUNT.address,
          typedData,
        },
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
      })
        .provide(confirmProviders(dappInfoOn(UniverseChainId.Base)))
        .not.call.fn(signTypedDataMessage)
        .silentRun()

      expect(effects.put.some((effect) => effect.payload.action.type === rejectRequest.type)).toBe(true)
    })
  })
})
