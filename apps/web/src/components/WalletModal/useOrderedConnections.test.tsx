import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import {
  BINANCE_WALLET_CONNECTOR,
  COINBASE_INJECTED_CONNECTOR,
  COINBASE_SDK_CONNECTOR,
  EMBEDDED_WALLET_CONNECTOR,
  INJECTED_CONNECTOR,
  METAMASK_INJECTED_CONNECTOR,
  UNISWAP_EXTENSION_CONNECTOR,
  UNISWAP_MOBILE_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
} from 'test-utils/wagmi/fixtures'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useConnect } from 'wagmi'

let mockIsMobileWeb = false
vi.mock('utilities/src/platform', async () => {
  const actual = await vi.importActual('utilities/src/platform')
  return {
    ...actual,
    get isMobileWeb() {
      return mockIsMobileWeb
    },
  }
})

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnect: vi.fn(),
  }
})

vi.mock('components/Web3Provider/constants', async () => {
  const actual = await vi.importActual('components/Web3Provider/constants')
  return {
    ...actual,
    useRecentConnectorId: vi.fn(),
  }
})

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
}))

const DEFAULT_CONNECTORS = [
  INJECTED_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
  COINBASE_SDK_CONNECTOR,
  METAMASK_INJECTED_CONNECTOR,
  EMBEDDED_WALLET_CONNECTOR,
  BINANCE_WALLET_CONNECTOR,
]

describe('useOrderedConnections', () => {
  beforeEach(() => {
    mockIsMobileWeb = false
    mocked(useConnect).mockReturnValue({
      connectors: DEFAULT_CONNECTORS,
    } as unknown as ReturnType<typeof useConnect>)
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useRecentConnectorId).mockReturnValue(undefined)
  })

  it('should return ordered connectors', () => {
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should throw an error if expected connectors are missing', () => {
    mocked(useConnect).mockReturnValue({ connectors: [WALLET_CONNECT_CONNECTOR] } as unknown as ReturnType<
      typeof useConnect
    >)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.error?.message).toEqual('Expected connector injected missing from wagmi context.')
  })

  it('should place the most recent connector at the top of the list', () => {
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should return only injected connectors for in-wallet browsers', () => {
    mockIsMobileWeb = true
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
  })

  it('should return only the Coinbase injected connector in the Coinbase Wallet', async () => {
    mockIsMobileWeb = true
    mocked(useConnect).mockReturnValue({
      connectors: [
        INJECTED_CONNECTOR,
        WALLET_CONNECT_CONNECTOR,
        COINBASE_SDK_CONNECTOR,
        COINBASE_INJECTED_CONNECTOR,
        EMBEDDED_WALLET_CONNECTOR,
        BINANCE_WALLET_CONNECTOR,
      ],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
  })

  it('should not return uniswap connections', () => {
    mocked(useConnect).mockReturnValue({
      connectors: [...DEFAULT_CONNECTORS, UNISWAP_EXTENSION_CONNECTOR],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should include the fallback injected provider when no eip6963 injectors are present', async () => {
    window.ethereum = true as any
    mocked(useConnect).mockReturnValue({
      connectors: [
        UNISWAP_MOBILE_CONNECTOR,
        INJECTED_CONNECTOR,
        WALLET_CONNECT_CONNECTOR,
        COINBASE_SDK_CONNECTOR,
        EMBEDDED_WALLET_CONNECTOR,
        BINANCE_WALLET_CONNECTOR,
      ],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
    ]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should include only the fallback injected provider when no eip6963 injectors are present on mobile', async () => {
    mockIsMobileWeb = true
    window.ethereum = true as any
    mocked(useConnect).mockReturnValue({
      connectors: [
        INJECTED_CONNECTOR,
        WALLET_CONNECT_CONNECTOR,
        COINBASE_SDK_CONNECTOR,
        EMBEDDED_WALLET_CONNECTOR,
        BINANCE_WALLET_CONNECTOR,
      ],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    const expectedConnectors = [{ id: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID }]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  describe('with embedded wallet enabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockReturnValue(true)
    })

    it('should show embedded wallet connector in primary view', () => {
      const { result } = renderHook(() => useOrderedConnections())

      const expectedConnectors = [
        { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
        { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.id).toEqual(expectedConnectors[index].id)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should include recent mobile connectors in primary view', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedConnections())

      const expectedConnectors = [
        { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
        { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
        { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.id).toEqual(expectedConnectors[index].id)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })
  })

  describe('with showSecondaryConnectors', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockReturnValue(true)
    })

    it('should show mobile connectors and filter out recent connector', () => {
      mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
      const { result } = renderHook(() => useOrderedConnections({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
        { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.id).toEqual(expectedConnectors[index].id)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })

    it('should show all mobile connectors when no recent connector', () => {
      const { result } = renderHook(() => useOrderedConnections({ showSecondaryConnectors: true }))

      const expectedConnectors = [
        { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
        { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
        { id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID },
      ]

      result.current.forEach((connector, index) => {
        expect(connector.id).toEqual(expectedConnectors[index].id)
      })
      expect(result.current.length).toEqual(expectedConnectors.length)
    })
  })
})
