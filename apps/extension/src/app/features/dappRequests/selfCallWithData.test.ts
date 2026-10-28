import { UniverseChainId } from '@universe/chains'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { type DappInfo, dappStore } from 'src/app/features/dapp/store'
import { handleSendCalls, handleSendTransaction } from 'src/app/features/dappRequests/saga'
import { type SenderTabInfo } from 'src/app/features/dappRequests/shared'
import {
  EthSendTransactionRPCActions,
  type SendCallsRequest,
  type SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { TransactionType, type TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { getProvider } from 'wallet/src/features/wallet/context'
import { ACCOUNT } from 'wallet/src/test/fixtures'

const SENDER_TAB_INFO: SenderTabInfo = {
  tabId: 1,
  frameId: 0,
  frameUrl: 'https://dapp.example/swap',
  tabUrl: 'https://dapp.example/swap',
  isCrossOriginFrame: false,
  favIconUrl: 'https://dapp.example/favicon.ico',
}

const CONTRACT = '0x4444444444444444444444444444444444444444'
const SPOOFED_FROM = '0x3333333333333333333333333333333333333333'
const CALLDATA = '0xdeadbeef'

const DAPP_INFO: DappInfo = {
  lastChainId: UniverseChainId.Mainnet,
  connectedAccounts: [ACCOUNT],
  activeConnectedAddress: ACCOUNT.address,
}

const providers: StaticProvider[] = [
  [matchers.call.fn(dappStore.getDappInfo), DAPP_INFO],
  [
    matchers.call.fn(getProvider),
    // handleSendTransaction kicks off onTransactionSentToChain without awaiting it.
    { connection: { url: 'https://rpc.example/' }, waitForTransaction: async () => ({ status: 1 }) },
  ],
  [matchers.call.fn(executeTransaction), { transactionHash: '0xhash' }],
  [matchers.call.fn(dappResponseMessageChannel.sendMessageToFrame), undefined],
]

function sendTransactionRequest(transaction: SendTransactionRequest['transaction']): SendTransactionRequest {
  return {
    type: DappRequestType.SendTransaction,
    requestId: 'request-1',
    contractInteractions: EthSendTransactionRPCActions.Unknown,
    transaction: { value: '0x0', chainId: UniverseChainId.Mainnet, ...transaction },
  }
}

// These run after the user confirms, against the account that will actually sign. They hold even if
// a request slipped past the content script guard with an omitted or spoofed `from`.
describe('self-call with data, checked against the signing account', () => {
  describe('handleSendTransaction', () => {
    it('refuses to sign a self-call with data when from is omitted', async () => {
      await expect(
        expectSaga(handleSendTransaction, {
          request: sendTransactionRequest({ to: ACCOUNT.address, data: CALLDATA }),
          senderTabInfo: SENDER_TAB_INFO,
          dappInfo: DAPP_INFO,
        })
          .provide(providers)
          .not.call.fn(executeTransaction)
          .silentRun(),
      ).rejects.toThrow('Self-calls with data are not supported')
    })

    it('refuses to sign a self-call with data when from is spoofed', async () => {
      await expect(
        expectSaga(handleSendTransaction, {
          request: sendTransactionRequest({ from: SPOOFED_FROM, to: ACCOUNT.address, data: CALLDATA }),
          senderTabInfo: SENDER_TAB_INFO,
          dappInfo: DAPP_INFO,
        })
          .provide(providers)
          .not.call.fn(executeTransaction)
          .silentRun(),
      ).rejects.toThrow('Self-calls with data are not supported')
    })

    it('signs a self-transfer without data', async () => {
      await expectSaga(handleSendTransaction, {
        request: sendTransactionRequest({ to: ACCOUNT.address, value: '0x1' }),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: DAPP_INFO,
      })
        .provide(providers)
        .call.fn(executeTransaction)
        .silentRun()
    })
  })

  describe('handleSendCalls', () => {
    const encodedTypeInfo: TransactionTypeInfo = {
      type: TransactionType.SendCalls,
      encodedTransaction: { from: ACCOUNT.address, to: ACCOUNT.address, data: CALLDATA },
      encodedRequestId: 'encoded-1',
    }

    function sendCallsRequest(calls: SendCallsRequest['calls']): SendCallsRequest {
      return {
        type: DappRequestType.SendCalls,
        requestId: 'send-calls-1',
        version: '2.0.0',
        from: SPOOFED_FROM,
        chainId: '0x1',
        calls,
      }
    }

    // handleSendCalls reports failure to the dapp rather than rethrowing.
    function responsesSentToTab(effects: {
      call: Array<{ payload: { fn: unknown; args: unknown[] } }>
    }): { type: unknown; error?: { code: number } }[] {
      return effects.call
        .filter((effect) => effect.payload.fn === dappResponseMessageChannel.sendMessageToFrame)
        .map((effect) => effect.payload.args[1] as { type: unknown; error?: { code: number } })
    }

    it('refuses to submit a batch with a self-call with data when from is spoofed', async () => {
      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest([
          { to: CONTRACT, data: CALLDATA },
          { to: ACCOUNT.address, data: CALLDATA },
        ]),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: DAPP_INFO,
        transactionTypeInfo: encodedTypeInfo,
      })
        .provide(providers)
        .not.call.fn(executeTransaction)
        .silentRun()

      // Same code the content script guard returns.
      expect(responsesSentToTab(effects)).toEqual([
        expect.objectContaining({
          type: DappResponseType.ErrorResponse,
          error: expect.objectContaining({ code: 4200 }),
        }),
      ])
    })

    it('submits a batch that only calls contracts', async () => {
      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest([{ to: CONTRACT, data: CALLDATA }]),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: DAPP_INFO,
        transactionTypeInfo: encodedTypeInfo,
      })
        .provide(providers)
        .call.fn(executeTransaction)
        .silentRun()

      expect(responsesSentToTab(effects).map((response) => response.type)).toEqual([DappResponseType.SendCallsResponse])
    })
  })
})
