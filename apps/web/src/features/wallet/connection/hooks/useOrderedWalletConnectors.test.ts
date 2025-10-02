import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { createAccountsStoreGetters } from 'features/accounts/store/getters'
import { useAccountsStore } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { useOrderedWallets } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

// biome-ignore lint/suspicious/noVar: Testing variable hoisting behavior requires var
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

vi.mock('features/accounts/store/hooks', () => ({
  useAccountsStore: vi.fn(),
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

const createExternalWallet = (overrides: Partial<ExternalWallet> = {}): ExternalWallet => ({
  id: 'test-wallet-id',
  name: 'Test Wallet',
  connectorIds: {
    [Platform.EVM]: 'test-connector-id',
  },
  analyticsWalletType: 'Browser Extension',
  signingCapability: SigningCapability.Interactive,
  addresses: {},
  ...overrides,
})

const createEmbeddedWallet = (overrides: Partial<ExternalWallet> = {}): ExternalWallet => ({
  id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
  name: 'Embedded Wallet',
  connectorIds: {
    [Platform.EVM]: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
  },
  analyticsWalletType: 'Passkey',
  signingCapability: SigningCapability.Interactive,
  addresses: {},
  ...overrides,
})

const createMockAccountsState = (wallets: ExternalWallet[]) => {
  const walletsMap = wallets.reduce(
    (acc, wallet) => {
      acc[wallet.id] = wallet
      return acc
    },
    {} as Record<string, ExternalWallet>,
  )

  const connectorsMap = wallets.reduce(
    (acc, wallet) => {
      const evmConnectorId = wallet.connectorIds[Platform.EVM]
      if (evmConnectorId) {
        acc[evmConnectorId] = {
          id: evmConnectorId,
          platform: Platform.EVM,
          access:
            wallet.id === CONNECTION_PROVIDER_IDS.METAMASK_RDNS ||
            wallet.id === CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID ||
            wallet.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS ||
            wallet.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS ||
            wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS
              ? 'Injected'
              : 'SDK',
          externalLibraryId: wallet.id,
        }
      }
      return acc
    },
    {} as Record<string, any>,
  )

  const mockData = {
    wallets: walletsMap,
    connectors: connectorsMap,
    activeConnectors: {},
    accounts: {},
    connectionQueryIsPending: false,
  }

  // Add getter functions to the mock state
  const getters = createAccountsStoreGetters(() => mockData)

  return {
    ...mockData,
    ...getters,
  } as any
}

const DEFAULT_WALLETS: ExternalWallet[] = [
  createExternalWallet({
    id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS,
    name: 'MetaMask',
    connectorIds: {
      [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.METAMASK_RDNS}`,
    },
    analyticsWalletType: 'Browser Extension',
  }),
  createExternalWallet({
    id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
    name: 'WalletConnect',
    connectorIds: {
      [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID}`,
    },
    analyticsWalletType: 'Wallet Connect',
  }),
  createExternalWallet({
    id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
    name: 'Coinbase Wallet',
    connectorIds: {
      [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID}`,
    },
    analyticsWalletType: 'Coinbase Wallet',
  }),
  createExternalWallet({
    id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
    name: 'Binance Wallet',
    connectorIds: {
      [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID}`,
    },
    analyticsWalletType: 'binance',
  }),
  createExternalWallet({
    id: CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
    name: 'Porto',
    connectorIds: {
      [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID}`,
    },
    analyticsWalletType: 'Porto',
  }),
  createEmbeddedWallet({
    name: 'Embedded Wallet',
    analyticsWalletType: 'Passkey',
  }),
]

describe('useOrderedWallets', () => {
  beforeEach(() => {
    mockIsMobileWeb = false
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(DEFAULT_WALLETS)
      return selector(mockState)
    })
    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.EmbeddedWallet) {
        return false
      }
      if (flag === FeatureFlags.Solana) {
        return false
      }
      if (flag === FeatureFlags.PortoWalletConnector) {
        return true
      }
      return false
    })
    mocked(useRecentConnectorId).mockReturnValue(undefined)
  })

  it('should return ordered wallets', () => {
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

    // The new behavior returns injected wallets first, then mobile wallets
    const expectedWalletIds = [
      CONNECTION_PROVIDER_IDS.METAMASK_RDNS, // Injected wallet
      CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
    ]

    result.current.forEach((wallet, index) => {
      expect(wallet.id).toEqual(expectedWalletIds[index])
    })
    expect(result.current.length).toEqual(expectedWalletIds.length)
  })

  it('should place the most recent wallet at the top of the list', () => {
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

    const expectedWalletIds = [
      CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, // Recent wallet moved to top
      CONNECTION_PROVIDER_IDS.METAMASK_RDNS, // Injected wallet
      CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
    ]

    result.current.forEach((wallet, index) => {
      expect(wallet.id).toEqual(expectedWalletIds[index])
    })
    expect(result.current.length).toEqual(expectedWalletIds.length)
  })

  it('should return only injected wallets for in-wallet browsers', () => {
    mockIsMobileWeb = true
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))
    // When mobile web and only one injected wallet, should return only injected wallets
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
  })

  it('should return only the Coinbase wallet in the Coinbase Wallet', () => {
    mockIsMobileWeb = true
    const coinbaseWallets = [
      ...DEFAULT_WALLETS,
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.COINBASE_RDNS,
        name: 'Coinbase Injected',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_RDNS}`,
        },
        analyticsWalletType: 'Coinbase Wallet',
      }),
    ]
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(coinbaseWallets)
      return selector(mockState)
    })
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
  })

  it('should handle Binance injected wallet without throwing error', () => {
    mockIsMobileWeb = true
    const binanceWallets = [
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS,
        name: 'MetaMask',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.METAMASK_RDNS}`,
        },
        analyticsWalletType: 'Browser Extension',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
        name: 'WalletConnect',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Wallet Connect',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        name: 'Coinbase Wallet',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createEmbeddedWallet({
        name: 'Embedded Wallet',
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected wallet to simulate Binance browser
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS,
        name: 'Binance Injected',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS}`,
        },
        analyticsWalletType: 'binance',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
        name: 'Porto',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Porto',
      }),
    ]
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(binanceWallets)
      return selector(mockState)
    })

    // Should not throw error and should include multiple wallets
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

    // Should include injected wallets (MetaMask, Binance) and mobile wallets
    expect(result.current.length).toBeGreaterThan(1)

    // Should include Binance injected wallet
    const binanceInjectedWallet = result.current.find((w) => w.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS)
    expect(binanceInjectedWallet).toBeDefined()

    // Should include other wallets like MetaMask
    const metamaskWallet = result.current.find((w) => w.id === CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
    expect(metamaskWallet).toBeDefined()
  })

  it('should include other wallets alongside Binance injected on desktop', () => {
    // Desktop scenario with Binance browser (need to mock mobile web to trigger Binance browser detection)
    mockIsMobileWeb = true // This makes isBinanceWalletBrowser return true
    const binanceWallets = [
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS,
        name: 'MetaMask',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.METAMASK_RDNS}`,
        },
        analyticsWalletType: 'Browser Extension',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
        name: 'WalletConnect',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Wallet Connect',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        name: 'Coinbase Wallet',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createEmbeddedWallet({
        name: 'Embedded Wallet',
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected wallet to simulate Binance browser
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS,
        name: 'Binance Injected',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS}`,
        },
        analyticsWalletType: 'binance',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
        name: 'Porto',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Porto',
      }),
    ]
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(binanceWallets)
      return selector(mockState)
    })

    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

    // Should include injected wallets (MetaMask, Binance) and mobile wallets
    expect(result.current.length).toBeGreaterThan(1)

    // Should include Binance injected wallet
    const binanceInjectedWallet = result.current.find((w) => w.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS)
    expect(binanceInjectedWallet).toBeDefined()

    // Should include other wallets like MetaMask
    const metamaskWallet = result.current.find((w) => w.id === CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
    expect(metamaskWallet).toBeDefined()

    // Should include mobile wallets like WalletConnect
    const walletConnectWallet = result.current.find((w) => w.id === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    expect(walletConnectWallet).toBeDefined()
  })

  it('should handle Binance injected wallet in secondary view', () => {
    // Need mobile web to trigger Binance browser detection
    mockIsMobileWeb = true
    const binanceWallets = [
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS,
        name: 'MetaMask',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.METAMASK_RDNS}`,
        },
        analyticsWalletType: 'Browser Extension',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
        name: 'WalletConnect',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Wallet Connect',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        name: 'Coinbase Wallet',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Coinbase Wallet',
      }),
      createEmbeddedWallet({
        name: 'Embedded Wallet',
        analyticsWalletType: 'Passkey',
      }),
      // Add Binance injected wallet to simulate Binance browser
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS,
        name: 'Binance Injected',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS}`,
        },
        analyticsWalletType: 'binance',
      }),
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
        name: 'Porto',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID}`,
        },
        analyticsWalletType: 'Porto',
      }),
    ]
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(binanceWallets)
      return selector(mockState)
    })

    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: true }))

    // Should include WalletConnect and Coinbase (but not Binance SDK since it doesn't exist)
    const expectedWalletIds = [
      CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
    ]

    expectedWalletIds.forEach((expectedId, index) => {
      expect(result.current[index].id).toEqual(expectedId)
    })

    expect(result.current.length).toEqual(expectedWalletIds.length)
  })

  it('should not return uniswap connections when embedded wallet is disabled', () => {
    const walletsWithUniswap = [
      ...DEFAULT_WALLETS,
      createExternalWallet({
        id: CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS,
        name: 'Uniswap Extension',
        connectorIds: {
          [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS}`,
        },
        analyticsWalletType: 'Browser Extension',
      }),
    ]
    mocked(useAccountsStore).mockImplementation((selector) => {
      const mockState = createMockAccountsState(walletsWithUniswap)
      return selector(mockState)
    })
    const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

    const expectedWalletIds = [
      CONNECTION_PROVIDER_IDS.METAMASK_RDNS, // Injected wallet
      CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
      CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
    ]

    result.current.forEach((wallet, index) => {
      expect(wallet.id).toEqual(expectedWalletIds[index])
    })
    expect(result.current.length).toEqual(expectedWalletIds.length)
  })

  describe('with embedded wallet enabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EmbeddedWallet) {
          return true
        }
        if (flag === FeatureFlags.PortoWalletConnector) {
          return true
        }
        if (flag === FeatureFlags.Solana) {
          return false
        }
        return false
      })
    })

    it('should show embedded wallet in primary view', () => {
      const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

      const expectedWalletIds = [
        CONNECTION_PROVIDER_IDS.METAMASK_RDNS, // Injected wallet
        CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
      ]

      result.current.forEach((wallet, index) => {
        expect(wallet.id).toEqual(expectedWalletIds[index])
      })
      expect(result.current.length).toEqual(expectedWalletIds.length)
    })

    it('should include recent mobile wallets in primary view', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: false }))

      const expectedWalletIds = [
        CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID, // Recent wallet moved to top
        CONNECTION_PROVIDER_IDS.METAMASK_RDNS, // Injected wallet
        CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
      ]

      result.current.forEach((wallet, index) => {
        expect(wallet.id).toEqual(expectedWalletIds[index])
      })
      expect(result.current.length).toEqual(expectedWalletIds.length)
    })
  })

  describe('with showSecondaryConnectors', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EmbeddedWallet) {
          return true
        }
        if (flag === FeatureFlags.PortoWalletConnector) {
          return true
        }
        if (flag === FeatureFlags.Solana) {
          return false
        }
        return false
      })
    })

    it('should show mobile wallets and filter out recent wallet', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: true }))

      const expectedWalletIds = [
        CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
      ]

      result.current.forEach((wallet, index) => {
        expect(wallet.id).toEqual(expectedWalletIds[index])
      })
      expect(result.current.length).toEqual(expectedWalletIds.length)
    })

    it('should show all mobile wallets when no recent wallet', () => {
      const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: true }))

      const expectedWalletIds = [
        CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
      ]

      result.current.forEach((wallet, index) => {
        expect(wallet.id).toEqual(expectedWalletIds[index])
      })
      expect(result.current.length).toEqual(expectedWalletIds.length)
    })

    it('should show embedded wallet on mobile when enabled', () => {
      mockIsMobileWeb = true
      const mobileWallets = [
        createExternalWallet({
          id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
          name: 'WalletConnect',
          connectorIds: {
            [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID}`,
          },
          analyticsWalletType: 'Wallet Connect',
        }),
        createExternalWallet({
          id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
          name: 'Coinbase Wallet',
          connectorIds: {
            [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID}`,
          },
          analyticsWalletType: 'Coinbase Wallet',
        }),
        createEmbeddedWallet({
          name: 'Embedded Wallet',
          analyticsWalletType: 'Passkey',
        }),
        createExternalWallet({
          id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
          name: 'Binance Wallet',
          connectorIds: {
            [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID}`,
          },
          analyticsWalletType: 'binance',
        }),
        createExternalWallet({
          id: CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
          name: 'Porto',
          connectorIds: {
            [Platform.EVM]: `WagmiConnector_${CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID}`,
          },
          analyticsWalletType: 'Porto',
        }),
      ]
      mocked(useAccountsStore).mockImplementation((selector) => {
        const mockState = createMockAccountsState(mobileWallets)
        return selector(mockState)
      })
      const { result } = renderHook(() => useOrderedWallets({ showSecondaryConnectors: true }))

      const expectedWalletIds = [
        CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
        CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID,
      ]

      result.current.forEach((wallet, index) => {
        expect(wallet.id).toEqual(expectedWalletIds[index])
      })
      expect(result.current.length).toEqual(expectedWalletIds.length)
    })
  })
})
