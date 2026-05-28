import type { ExternalProvider } from '@ethersproject/providers'
import { JsonRpcProvider } from '@ethersproject/providers'
import type WalletConnectProvider from '@walletconnect/ethereum-provider'
import { getWalletMeta, WalletMeta, WalletType } from 'utils/walletMeta'

class MockJsonRpcProvider extends JsonRpcProvider {
  name = 'JsonRpcProvider'
  arg: string

  constructor(arg?: unknown) {
    super()
    this.arg = JSON.stringify(arg)
  }
}

const WC_META = { name: 'name', description: 'description', url: 'url', icons: [] }

class MockWalletConnectProviderV2 extends MockJsonRpcProvider {
  name = WalletType.WALLET_CONNECT
  provider: WalletConnectProvider

  constructor(metadata: typeof WC_META | null) {
    super(metadata)
    this.provider = { isWalletConnect: true, session: { peer: { metadata } } } as unknown as WalletConnectProvider
  }
}

class MockInjectedProvider extends MockJsonRpcProvider {
  name = WalletType.INJECTED
  provider: ExternalProvider

  constructor(provider: Record<string, boolean | undefined>) {
    super(provider)
    this.provider = {
      isConnected() {
        return true
      },
      ...provider,
    } as ExternalProvider
  }
}

const testCases: [MockJsonRpcProvider, WalletMeta | undefined][] = [
  [new MockJsonRpcProvider(), undefined],
  [new MockWalletConnectProviderV2(null), { type: WalletType.WALLET_CONNECT, agent: '(WalletConnect)' }],
  [
    new MockWalletConnectProviderV2(WC_META),
    { type: WalletType.WALLET_CONNECT, agent: 'name (WalletConnect)', ...WC_META },
  ],
  [new MockInjectedProvider({}), { type: WalletType.INJECTED, agent: '(Injected)', name: undefined }],
  [
    new MockInjectedProvider({ isMetaMask: false }),
    { type: WalletType.INJECTED, agent: '(Injected)', name: undefined },
  ],
  [
    new MockInjectedProvider({ isMetaMask: true }),
    { type: WalletType.INJECTED, agent: 'MetaMask (Injected)', name: 'MetaMask' },
  ],
  [
    new MockInjectedProvider({ isTest: true, isMetaMask: true }),
    { type: WalletType.INJECTED, agent: 'Test MetaMask (Injected)', name: 'Test' },
  ],
  [
    new MockInjectedProvider({ isCoinbaseWallet: true, qrUrl: undefined }),
    { type: WalletType.INJECTED, agent: 'CoinbaseWallet (Injected)', name: 'CoinbaseWallet' },
  ],
  [
    new MockInjectedProvider({ isCoinbaseWallet: true, qrUrl: true }),
    { type: WalletType.INJECTED, agent: 'CoinbaseWallet qrUrl (Injected)', name: 'CoinbaseWallet' },
  ],
  [
    new MockInjectedProvider({ isA: true, isB: false }),
    { type: WalletType.INJECTED, agent: 'A (Injected)', name: 'A' },
  ],
  [
    new MockInjectedProvider({ isA: true, isB: true }),
    { type: WalletType.INJECTED, agent: 'A B (Injected)', name: 'A' },
  ],
]

describe('meta', () => {
  describe.each(testCases)('getWalletMeta/getWalletName returns the project meta/name', (provider, meta) => {
    it(`${provider?.name} ${provider.arg}`, () => {
      expect(getWalletMeta(provider)).toEqual(meta)
    })
  })
})
