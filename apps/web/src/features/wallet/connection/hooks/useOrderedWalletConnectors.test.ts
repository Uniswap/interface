import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWalletConnectors } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// eslint-disable-next-line no-var
var mockIsMobileWeb = false
vi.mock('utilities/src/platform', async () => {
  const actual = await vi.importActual('utilities/src/platform')
  return {
    ...actual,
    get isMobileWeb() {
      return mockIsMobileWeb
    },
  }
})

vi.mock('features/wallet/connection/hooks/useWalletConnectors', () => ({
  useWalletConnectors: vi.fn(),
}))

vi.mock('components/Web3Provider/constants', async () => {
  const actual = await vi.importActual('components/Web3Provider/constants')
  return {
    ...actual,
    useRecentConnectorId: vi.fn(),
  }
})

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

const createWagmiWalletConnector = (overrides: Partial<WalletConnectorMeta> = {}): WalletConnectorMeta => ({
  name: 'Test Wallet',
  icon: 'test-icon',
  isInjected: false,
  wagmi: { id: 'test-connector-id', type: 'injected' },
  analyticsWalletType: 'Browser Extension',
  ...overrides,
})

const createCustomWalletConnector = (overrides: Partial<WalletConnectorMeta> = {}): WalletConnectorMeta => ({
  name: 'Test Custom Wallet',
  icon: 'test-icon',
  isInjected: false,
  customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
  analyticsWalletType: 'Passkey',
  ...overrides,
})

const DEFAULT_CONNECTORS: WalletConnectorMeta[] = [
  createWagmiWalletConnector({
    name: 'MetaMask',
    wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
    isInjected: true,
  }),
  createWagmiWalletConnector({
    name: 'WalletConnect',
    wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
    isInjected: false,
    analyticsWalletType: 'Wallet Connect',
  }),
  createWagmiWalletConnector({
    name: 'Coinbase Wallet',
    wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
    isInjected: false,
    analyticsWalletType: 'Coinbase Wallet',
  }),
  createWagmiWalletConnector({
    name: 'Binance Wallet',
    wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' },
    isInjected: false,
    analyticsWalletType: 'binance',
  }),
  createCustomWalletConnector({
    name: 'Embedded Wallet',
    customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
    isInjected: false,
    analyticsWalletType: 'Passkey',
  }),
]

describe('useOrderedWalletConnectors', () => {
  beforeEach(() => {
    mockIsMobileWeb = false
    mocked(useWalletConnectors).mockReturnValue(DEFAULT_CONNECTORS)
    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.EmbeddedWallet) {
        return false
      }
      if (flag === FeatureFlags.Solana) {
        return false
      }
      return false
    })
    mocked(useRecentConnectorId).mockReturnValue(undefined)
  })

  it('should return ordered connectors', () => {
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
      expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should throw an error if expected connectors are missing', () => {
    mocked(useWalletConnectors).mockReturnValue([
      createWagmiWalletConnector({
        name: 'WalletConnect',
        wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      }),
    ])
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.error?.message).toEqual('Expected connector coinbaseWalletSDK missing from connectors array.')
  })

  it('should place the most recent connector at the top of the list', () => {
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
      expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should return only injected connectors for in-wallet browsers', () => {
    mockIsMobileWeb = true
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.current.length).toEqual(1)
    expect(result.current[0].wagmi?.id).toEqual(CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
  })

  it('should return only the Coinbase connector in the Coinbase Wallet', () => {
    mockIsMobileWeb = true
    mocked(useWalletConnectors).mockReturnValue([
      ...DEFAULT_CONNECTORS,
      createWagmiWalletConnector({
        name: 'Coinbase Injected',
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))
    expect(result.current.length).toEqual(1)
    expect(result.current[0].wagmi?.id).toEqual(CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
  })

  it('should handle Binance injected connector without throwing error', () => {
    mockIsMobileWeb = true
    mocked(useWalletConnectors).mockReturnValue([
      // Include all default connectors except Binance SDK to simulate the scenario
      createWagmiWalletConnector({
        name: 'MetaMask',
        wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
        isInjected: true,
      }),
      createWagmiWalletConnector({
        name: 'WalletConnect',
        wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      }),
      createWagmiWalletConnector({
        name: 'Coinbase Wallet',
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
        isInjected: false,
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createCustomWalletConnector({
        name: 'Embedded Wallet',
        customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        isInjected: false,
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected connector to simulate Binance browser
      createWagmiWalletConnector({
        name: 'Binance Injected',
        wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])

    // Should not throw error and should include multiple connectors
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    // Should include injected connectors (MetaMask, Binance) and mobile connectors
    expect(result.current.length).toBeGreaterThan(1)

    // Should include Binance injected connector
    const binanceInjectedConnector = result.current.find(
      (c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS,
    )
    expect(binanceInjectedConnector).toBeDefined()

    // Should include other connectors like MetaMask
    const metamaskConnector = result.current.find((c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
    expect(metamaskConnector).toBeDefined()
  })

  it('should include other connectors alongside Binance injected on desktop', () => {
    // Desktop scenario with Binance browser (need to mock mobile web to trigger Binance browser detection)
    mockIsMobileWeb = true // This makes isBinanceWalletBrowser return true
    mocked(useWalletConnectors).mockReturnValue([
      // Include all default connectors except Binance SDK to simulate the scenario
      createWagmiWalletConnector({
        name: 'MetaMask',
        wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
        isInjected: true,
      }),
      createWagmiWalletConnector({
        name: 'WalletConnect',
        wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      }),
      createWagmiWalletConnector({
        name: 'Coinbase Wallet',
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
        isInjected: false,
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createCustomWalletConnector({
        name: 'Embedded Wallet',
        customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        isInjected: false,
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected connector to simulate Binance browser
      createWagmiWalletConnector({
        name: 'Binance Injected',
        wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])

    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    // Should include injected connectors (MetaMask, Binance) and mobile connectors
    expect(result.current.length).toBeGreaterThan(1)

    // Should include Binance injected connector
    const binanceInjectedConnector = result.current.find(
      (c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS,
    )
    expect(binanceInjectedConnector).toBeDefined()

    // Should include other connectors like MetaMask
    const metamaskConnector = result.current.find((c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
    expect(metamaskConnector).toBeDefined()

    // Should include mobile connectors like WalletConnect
    const walletConnectConnector = result.current.find(
      (c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
    )
    expect(walletConnectConnector).toBeDefined()
  })

  it('should handle Binance injected connector in secondary view', () => {
    // Need mobile web to trigger Binance browser detection
    mockIsMobileWeb = true
    mocked(useWalletConnectors).mockReturnValue([
      // Include all default connectors except Binance SDK
      createWagmiWalletConnector({
        name: 'MetaMask',
        wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' },
        isInjected: true,
      }),
      createWagmiWalletConnector({
        name: 'WalletConnect',
        wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
        isInjected: false,
        analyticsWalletType: 'Wallet Connect',
      }),
      createWagmiWalletConnector({
        name: 'Coinbase Wallet',
        wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
        isInjected: false,
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createCustomWalletConnector({
        name: 'Embedded Wallet',
        customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        isInjected: false,
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected connector to simulate Binance browser
      createWagmiWalletConnector({
        name: 'Binance Injected',
        wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])

    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

    // Should include WalletConnect and Coinbase (but not Binance SDK since it doesn't exist)
    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
    ]

    expectedConnectors.forEach((expected, index) => {
      expect(result.current[index].wagmi?.id).toEqual(expected.wagmi.id)
      expect(result.current[index].wagmi?.type).toEqual(expected.wagmi.type)
    })

    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should not return uniswap connections when embedded wallet is disabled', () => {
    mocked(useWalletConnectors).mockReturnValue([
      ...DEFAULT_CONNECTORS,
      createWagmiWalletConnector({
        name: 'Uniswap Extension',
        wagmi: { id: CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS, type: 'injected' },
        isInjected: true,
      }),
    ])
    const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

    const expectedConnectors = [
      { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
      { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
      expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  describe('with embedded wallet enabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EmbeddedWallet) {
          return true
        }
        if (flag === FeatureFlags.Solana) {
          return false
        }
        return false
      })
    })

    it('should show embedded wallet connector in primary view', () => {
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
        { customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        const expectedId = expectedConnectors[index].customConnectorId ?? expectedConnectors[index].wagmi?.id
        expect(connector.customConnectorId ?? connector.wagmi?.id).toEqual(expectedId)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should include recent mobile connectors in primary view', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: false }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS, type: 'injected' } },
        { customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        const expectedId = expectedConnectors[index].customConnectorId ?? expectedConnectors[index].wagmi?.id
        expect(connector.customConnectorId ?? connector.wagmi?.id).toEqual(expectedId)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })
  })

  describe('with showSecondaryConnectors', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EmbeddedWallet) {
          return true
        }
        if (flag === FeatureFlags.Solana) {
          return false
        }
        return false
      })
    })

    it('should show mobile connectors and filter out recent connector', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
        expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should show all mobile connectors when no recent connector', () => {
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.wagmi?.id).toEqual(expectedConnectors[index].wagmi.id)
        expect(connector.wagmi?.type).toEqual(expectedConnectors[index].wagmi.type)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should show embedded wallet connector on mobile when enabled', () => {
      mockIsMobileWeb = true
      mocked(useWalletConnectors).mockReturnValue([
        createWagmiWalletConnector({
          name: 'WalletConnect',
          wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' },
          isInjected: false,
        }),
        createWagmiWalletConnector({
          name: 'Coinbase Wallet',
          wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' },
          isInjected: false,
        }),
        createCustomWalletConnector({
          name: 'Embedded Wallet',
          customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
          isInjected: false,
        }),
        createWagmiWalletConnector({
          name: 'Binance Wallet',
          wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' },
          isInjected: false,
        }),
      ])
      const { result } = renderHook(() => useOrderedWalletConnectors({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, type: 'walletConnect' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID, type: 'coinbaseWallet' } },
        { wagmi: { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID, type: 'binance' } },
      ]

      result.current.forEach((connector, index) => {
        const expectedId = expectedConnectors[index].customConnectorId ?? expectedConnectors[index].wagmi?.id
        expect(connector.customConnectorId ?? connector.wagmi?.id).toEqual(expectedId)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })
  })
})
