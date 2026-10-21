import { select } from '@redux-saga/core/effects'
import { Platform, UniverseChainId } from '@universe/chains'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { type DappInfo, dappStore } from 'src/app/features/dapp/store'
import { addRequest, rejectRequest } from 'src/app/features/dappRequests/actions'
import {
  dappRequestWatcher,
  handleSendCalls,
  handleSendTransaction,
  handleSignTypedData,
} from 'src/app/features/dappRequests/saga'
import { type SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { dappRequestActions } from 'src/app/features/dappRequests/slice'
import {
  EthSendTransactionRPCActions,
  type SendCallsRequest,
  type SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { TransactionType, type TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
import { ACCOUNT } from 'wallet/src/test/fixtures'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getFeatureFlag: vi.fn(() => true),
}))

const SENDER_TAB_INFO: SenderTabInfo = {
  tabId: 1,
  frameId: 0,
  frameUrl: 'https://dapp.example/swap',
  tabUrl: 'https://dapp.example/swap',
  isCrossOriginFrame: false,
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

function sendCallsRequest(chainId: string): SendCallsRequest {
  return {
    type: DappRequestType.SendCalls,
    requestId: 'send-calls-1',
    version: '2.0.0',
    from: ACCOUNT.address,
    chainId,
    calls: [{ to: PERMIT2 }],
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

describe('wallet_sendCalls chain binding', () => {
  it('accepts a prefixed hexadecimal chain ID that matches the connected chain', async () => {
    const dappInfo = dappInfoOn(UniverseChainId.Optimism)

    const { effects } = await expectSaga(dappRequestWatcher)
      .provide(intakeProviders(dappInfo))
      .dispatch(
        addRequest({
          isSidebarClosed: false,
          dappRequest: sendCallsRequest('0xa'),
          senderTabInfo: SENDER_TAB_INFO,
        }),
      )
      .silentRun()

    expect(effects.put.some((effect) => effect.payload.action.type === rejectRequest.type)).toBe(false)
    expect(effects.put.some((effect) => effect.payload.action.type === dappRequestActions.add.type)).toBe(true)
  })

  it('rejects an unprefixed chain ID that execution would interpret as a different hexadecimal value', async () => {
    const dappInfo = dappInfoOn(UniverseChainId.Optimism)

    const { effects } = await expectSaga(dappRequestWatcher)
      .provide(intakeProviders(dappInfo))
      .dispatch(
        addRequest({
          isSidebarClosed: false,
          dappRequest: sendCallsRequest('10'),
          senderTabInfo: SENDER_TAB_INFO,
        }),
      )
      .silentRun()

    expect(effects.put.some((effect) => effect.payload.action.type === rejectRequest.type)).toBe(true)
    expect(effects.put.some((effect) => effect.payload.action.type === dappRequestActions.add.type)).toBe(false)
  })

  // Same staleness window as eth_sendTransaction. The prompt prepares and scans on the queued
  // snapshot chain, so the handler must refuse once the dapp has moved off it. The sponsored path
  // matters most: an unsigned UserOperation carries no chain, and the signer takes its EIP-712
  // domain from whatever chain the handler picks.
  describe('confirmation', () => {
    const unsignedUserOperation = {
      sender: ACCOUNT.address,
      nonce: '0x0',
      callData: '0x',
    } as unknown as RpcUserOperation<'0.8'>
    const sponsoredTypeInfo: TransactionTypeInfo = { type: TransactionType.SendCalls, unsignedUserOperation }
    const encodedTypeInfo: TransactionTypeInfo = {
      type: TransactionType.SendCalls,
      encodedTransaction: { from: ACCOUNT.address, to: PERMIT2, data: '0x' },
      encodedRequestId: 'encoded-1',
    }

    const executeUserOp = vi.fn(async () => ({ userOpHash: '0xuserop' }))

    const confirmProviders = (currentDappInfo: DappInfo | undefined): StaticProvider[] => [
      [matchers.call.fn(dappStore.getDappInfo), currentDappInfo],
      [matchers.call.fn(createTransactionServices), { transactionService: { executeUserOp } }],
      [matchers.call.fn(executeTransaction), { transactionHash: '0xhash' }],
      [matchers.call.fn(dappResponseMessageChannel.sendMessageToFrame), undefined],
    ]

    // handleSendCalls reports failure to the dapp rather than rethrowing.
    function responseTypesSentToTab(effects: {
      call: Array<{ payload: { fn: unknown; args: unknown[] } }>
    }): unknown[] {
      return effects.call
        .filter((effect) => effect.payload.fn === dappResponseMessageChannel.sendMessageToFrame)
        .map((effect) => (effect.payload.args[1] as { type: unknown }).type)
    }

    beforeEach(() => {
      executeUserOp.mockClear()
    })

    it('submits the sponsored user operation on the reviewed chain when the dapp has not moved', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest('0x1'),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
        transactionTypeInfo: sponsoredTypeInfo,
      })
        .provide(confirmProviders(reviewed))
        .call.fn(createTransactionServices)
        .silentRun()

      expect(executeUserOp).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: UniverseChainId.Mainnet, userOp: unsignedUserOperation }),
      )
      expect(responseTypesSentToTab(effects)).toEqual([DappResponseType.SendCallsResponse])
    })

    it('refuses to submit the sponsored user operation when the dapp switched chains while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest('0x1'),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
        transactionTypeInfo: sponsoredTypeInfo,
      })
        .provide(confirmProviders(dappInfoOn(UniverseChainId.Base)))
        .not.call.fn(createTransactionServices)
        .silentRun()

      expect(executeUserOp).not.toHaveBeenCalled()
      expect(responseTypesSentToTab(effects)).toEqual([DappResponseType.ErrorResponse])
    })

    it('refuses to submit when the dapp disconnected while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest('0x1'),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
        transactionTypeInfo: sponsoredTypeInfo,
      })
        .provide(confirmProviders(undefined))
        .not.call.fn(createTransactionServices)
        .silentRun()

      expect(executeUserOp).not.toHaveBeenCalled()
      expect(responseTypesSentToTab(effects)).toEqual([DappResponseType.ErrorResponse])
    })

    // Intake already pins the request chain to the snapshot; this keeps a stale persisted request
    // from slipping past the handler on its own.
    it('refuses to submit when the request chain disagrees with the reviewed snapshot', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest(`0x${UniverseChainId.Base.toString(16)}`),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
        transactionTypeInfo: sponsoredTypeInfo,
      })
        .provide(confirmProviders(reviewed))
        .not.call.fn(createTransactionServices)
        .silentRun()

      expect(executeUserOp).not.toHaveBeenCalled()
      expect(responseTypesSentToTab(effects)).toEqual([DappResponseType.ErrorResponse])
    })

    it('refuses to send the encoded 7702 transaction when the dapp switched chains while the prompt was open', async () => {
      const reviewed = dappInfoOn(UniverseChainId.Mainnet)

      const { effects } = await expectSaga(handleSendCalls, {
        request: sendCallsRequest('0x1'),
        senderTabInfo: SENDER_TAB_INFO,
        dappInfo: reviewed,
        transactionTypeInfo: encodedTypeInfo,
      })
        .provide(confirmProviders(dappInfoOn(UniverseChainId.Base)))
        .not.call.fn(executeTransaction)
        .silentRun()

      expect(responseTypesSentToTab(effects)).toEqual([DappResponseType.ErrorResponse])
    })
  })
})
