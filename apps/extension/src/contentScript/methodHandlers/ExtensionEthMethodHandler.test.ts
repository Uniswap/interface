import { contentScriptToBackgroundMessageChannel } from 'src/background/messagePassing/messageChannels'
import { ExtensionEthMethodHandler } from 'src/contentScript/methodHandlers/ExtensionEthMethodHandler'
import {
  type EthSendTransactionRequest,
  EthSendTransactionRequestSchema,
  type WalletSendCallsRequest,
  WalletSendCallsRequestSchema,
} from 'src/contentScript/WindowEthereumRequestTypes'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'

vi.mock('src/background/messagePassing/messageChannels', () => ({
  contentScriptToBackgroundMessageChannel: { sendMessage: vi.fn() },
  dappResponseMessageChannel: { addMessageListener: vi.fn() },
}))

const ACTIVE_ACCOUNT = '0x1111111111111111111111111111111111111111'
const OTHER_CONNECTED_ACCOUNT = '0x2222222222222222222222222222222222222222'
const UNCONNECTED_ADDRESS = '0x3333333333333333333333333333333333333333'
const CONTRACT = '0x4444444444444444444444444444444444444444'
const CALLDATA = '0xdeadbeef'
const UNSUPPORTED_METHOD_CODE = 4200

function createHandler(): ExtensionEthMethodHandler {
  return new ExtensionEthMethodHandler({
    getChainId: () => '0x1',
    getProvider: () => undefined,
    getConnectedAddresses: () => [ACTIVE_ACCOUNT, OTHER_CONNECTED_ACCOUNT],
    setChainIdAndMaybeEmit: vi.fn(),
    setProvider: vi.fn(),
    setConnectedAddressesAndMaybeEmit: vi.fn(),
  })
}

function createSource(): { postMessage: ReturnType<typeof vi.fn>; asSource: MessageEventSource } {
  const postMessage = vi.fn()
  return { postMessage, asSource: { postMessage } as unknown as MessageEventSource }
}

function sendTransactionRequest(transaction: Record<string, unknown>): EthSendTransactionRequest {
  return EthSendTransactionRequestSchema.parse({
    requestId: 'request-1',
    method: 'eth_sendTransaction',
    params: [{ value: '0x0', ...transaction }],
  })
}

function sendCallsRequest({
  from,
  calls,
}: {
  from: string
  calls: { to: string; data?: string }[]
}): WalletSendCallsRequest {
  return WalletSendCallsRequestSchema.parse({
    requestId: '6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
    method: 'wallet_sendCalls',
    params: [{ version: '2.0.0', from, chainId: '0x1', calls }],
  })
}

function expectRejectedAsSelfCall(postMessage: ReturnType<typeof vi.fn>): void {
  expect(postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ error: expect.objectContaining({ code: UNSUPPORTED_METHOD_CODE }) }),
  )
  expect(contentScriptToBackgroundMessageChannel.sendMessage).not.toHaveBeenCalled()
}

describe('ExtensionEthMethodHandler self-call guard', () => {
  beforeEach(() => {
    vi.mocked(contentScriptToBackgroundMessageChannel.sendMessage).mockClear()
  })

  // The background signs with the active connected account, so the dapp-supplied `from` can't be
  // what decides whether a request is a self-call.
  describe('eth_sendTransaction', () => {
    it('rejects a self-call with data when from is set', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(
        sendTransactionRequest({ from: ACTIVE_ACCOUNT, to: ACTIVE_ACCOUNT, data: CALLDATA }),
        asSource,
      )

      expectRejectedAsSelfCall(postMessage)
    })

    it('rejects a self-call with data when from is omitted', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(
        sendTransactionRequest({ to: ACTIVE_ACCOUNT, data: CALLDATA }),
        asSource,
      )

      expectRejectedAsSelfCall(postMessage)
    })

    it('rejects a self-call with data when from is spoofed', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(
        sendTransactionRequest({ from: UNCONNECTED_ADDRESS, to: ACTIVE_ACCOUNT, data: CALLDATA }),
        asSource,
      )

      expectRejectedAsSelfCall(postMessage)
    })

    it('rejects a call with data to any connected account, not just the active one', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(
        sendTransactionRequest({ to: OTHER_CONNECTED_ACCOUNT, data: CALLDATA }),
        asSource,
      )

      expectRejectedAsSelfCall(postMessage)
    })

    it('forwards a contract call when from is omitted', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(sendTransactionRequest({ to: CONTRACT, data: CALLDATA }), asSource)

      expect(postMessage).not.toHaveBeenCalled()
      expect(contentScriptToBackgroundMessageChannel.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: DappRequestType.SendTransaction }),
      )
    })

    it('forwards a self-transfer without data', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleEthSendTransaction(
        sendTransactionRequest({ to: ACTIVE_ACCOUNT, value: '0x1' }),
        asSource,
      )

      expect(postMessage).not.toHaveBeenCalled()
      expect(contentScriptToBackgroundMessageChannel.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: DappRequestType.SendTransaction }),
      )
    })
  })

  describe('wallet_sendCalls', () => {
    it('rejects a call with data to the active account when from is spoofed', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleWalletSendCalls(
        sendCallsRequest({
          from: UNCONNECTED_ADDRESS,
          calls: [
            { to: CONTRACT, data: CALLDATA },
            { to: ACTIVE_ACCOUNT, data: CALLDATA },
          ],
        }),
        asSource,
      )

      expectRejectedAsSelfCall(postMessage)
    })

    it('forwards calls that only target contracts', async () => {
      const { postMessage, asSource } = createSource()

      await createHandler().handleWalletSendCalls(
        sendCallsRequest({ from: ACTIVE_ACCOUNT, calls: [{ to: CONTRACT, data: CALLDATA }] }),
        asSource,
      )

      expect(postMessage).not.toHaveBeenCalled()
      expect(contentScriptToBackgroundMessageChannel.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: DappRequestType.SendCalls }),
      )
    })
  })
})
