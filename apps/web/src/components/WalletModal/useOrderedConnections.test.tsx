import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
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
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
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
  INJECTED_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
  COINBASE_SDK_CONNECTOR,
  METAMASK_INJECTED_CONNECTOR,
]

describe('useOrderedConnections', () => {
  beforeEach(() => {
    UserAgentMock.isMobileWeb = false
    mocked(useConnect).mockReturnValue({
      connectors: DEFAULT_CONNECTORS,
    } as unknown as ReturnType<typeof useConnect>)
  })

  it('should return ordered connectors', () => {
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
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
    mocked(useRecentConnectorId).mockReturnValue(CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const { result } = renderHook(() => useOrderedConnections())

    const expectedConnectors = [
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
    ]

    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should return only injected connectors for in-wallet browsers', () => {
    UserAgentMock.isMobileWeb = true
    const { result } = renderHook(() => useOrderedConnections())
    expect(result.current.length).toEqual(1)
    expect(result.current[0].id).toEqual(CONNECTION_PROVIDER_IDS.METAMASK_RDNS)
  })

  it('should return only the Coinbase injected connector in the Coinbase Wallet', async () => {
    UserAgentMock.isMobileWeb = true
    mocked(useConnect).mockReturnValue({
      connectors: [INJECTED_CONNECTOR, WALLET_CONNECT_CONNECTOR, COINBASE_SDK_CONNECTOR, COINBASE_INJECTED_CONNECTOR],
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
      { id: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID },
      { id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID },
    ]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })

  it('should include only the fallback injected provider when no eip6963 injectors are present on mobile', async () => {
    UserAgentMock.isMobileWeb = true
    window.ethereum = true as any
    mocked(useConnect).mockReturnValue({
      connectors: [INJECTED_CONNECTOR, WALLET_CONNECT_CONNECTOR, COINBASE_SDK_CONNECTOR],
    } as unknown as ReturnType<typeof useConnect>)
    const { result } = renderHook(() => useOrderedConnections())
    const expectedConnectors = [{ id: CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID }]
    result.current.forEach((connector, index) => {
      expect(connector.id).toEqual(expectedConnectors[index].id)
    })
    expect(result.current.length).toEqual(expectedConnectors.length)
  })
})
