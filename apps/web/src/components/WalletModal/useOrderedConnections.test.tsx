import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { CONNECTION, useRecentConnectorId } from 'components/Web3Provider/constants'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import {
  COINBASE_INJECTED_CONNECTOR,
  COINBASE_SDK_CONNECTOR,
  INJECTED_CONNECTOR,
  METAMASK_INJECTED_CONNECTOR,
  UNISWAP_EXTENSION_CONNECTOR,
  UNISWAP_MOBILE_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
} from 'test-utils/wagmi/fixtures'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useConnect } from 'wagmi'

const UserAgentMock = jest.requireMock('utilities/src/platform')
jest.mock('utilities/src/platform', () => ({
  ...jest.requireActual('utilities/src/platform'),
}))

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useConnect: jest.fn(),
}))

jest.mock('components/Web3Provider/constants', () => ({
  ...jest.requireActual('components/Web3Provider/constants'),
  useRecentConnectorId: jest.fn(),
}))

const DEFAULT_CONNECTORS = [
  UNISWAP_MOBILE_CONNECTOR,
  INJECTED_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
  COINBASE_SDK_CONNECTOR,
  METAMASK_INJECTED_CONNECTOR,
]

describe('useOrderedConnections', () => {
  beforeEach(() => {
    UserAgentMock.isMobile = false
    mocked(useConnect).mockReturnValue({
      connectors: DEFAULT_CONNECTORS,
    } as unknown as ReturnType<typeof useConnect>)
  })

  it('should return ordered connectors', () => {
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.METAMASK_RDNS },
      { id: CONNECTION.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.COINBASE_SDK_CONNECTOR_ID },
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
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.error?.message).toEqual('Expected connector injected missing from wagmi context.')
  })

  it('should place the most recent connector at the top of the list', () => {
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.METAMASK_RDNS },
      { id: CONNECTION.COINBASE_SDK_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should return only injected connectors for in-wallet browsers', () => {
    UserAgentMock.isMobile = true
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION.METAMASK_RDNS)
  })

  it('should return only the Coinbase injected connector in the Coinbase Wallet', async () => {
    UserAgentMock.isMobile = true
    mocked(useConnect).mockReturnValue({
      connectors: [
        UNISWAP_MOBILE_CONNECTOR,
        INJECTED_CONNECTOR,
        WALLET_CONNECT_CONNECTOR,
        COINBASE_SDK_CONNECTOR,
        COINBASE_INJECTED_CONNECTOR,
      ],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION.COINBASE_SDK_CONNECTOR_ID)
  })

  it('should not return uniswap connections when excludeUniswapConnections is true', () => {
    mocked(useConnect).mockReturnValue({
      connectors: [...DEFAULT_CONNECTORS, UNISWAP_EXTENSION_CONNECTOR],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections(true))

    const expectedConnectors = [
      { id: CONNECTION.METAMASK_RDNS },
      { id: CONNECTION.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.COINBASE_SDK_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should include the fallback injected provider when no eip6963 injectors are present', async () => {
    window.ethereum = true as any
    mocked(useConnect).mockReturnValue({
      connectors: [UNISWAP_MOBILE_CONNECTOR, INJECTED_CONNECTOR, WALLET_CONNECT_CONNECTOR, COINBASE_SDK_CONNECTOR],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    const expectedConnectors = [
      { id: CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.INJECTED_CONNECTOR_ID },
      { id: CONNECTION.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION.COINBASE_SDK_CONNECTOR_ID },
    ]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should include only the fallback injected provider when no eip6963 injectors are present on mobile', async () => {
    UserAgentMock.isMobile = true
    window.ethereum = true as any
    mocked(useConnect).mockReturnValue({
      connectors: [UNISWAP_MOBILE_CONNECTOR, INJECTED_CONNECTOR, WALLET_CONNECT_CONNECTOR, COINBASE_SDK_CONNECTOR],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    const expectedConnectors = [{ id: CONNECTION.INJECTED_CONNECTOR_ID }]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })
})
