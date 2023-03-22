import { ConnectionType, getConnections, useGetConnection } from 'connection'
import { renderHook } from 'test-utils'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const UserAgentMock = jest.requireMock('utils/userAgent')
jest.mock('utils/userAgent', () => ({
  isMobile: false,
}))

it('Non-injected Desktop', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = undefined

  const { result } = renderHook(() => useGetConnection())
  const getConnection = result.current
  const injectedConnection = getConnection(ConnectionType.INJECTED)

  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('Install MetaMask')
  expect(injectedConnection.overrideActivate).toBeDefined()
  expect(injectedConnection.shouldDisplay).toBe(true)

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('MetaMask Injected Desktop', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = { isMetaMask: true }

  const { result } = renderHook(() => useGetConnection())
  const getConnection = result.current
  const injectedConnection = getConnection(ConnectionType.INJECTED)

  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('MetaMask')
  expect(injectedConnection.overrideActivate).toBeUndefined()
  expect(injectedConnection.shouldDisplay).toBe(true)

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Coinbase Injected Desktop', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = { isCoinbaseWallet: true }

  const { result: getConnection } = renderHook(() => useGetConnection())
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)
  const cbConnection = getConnection.current(ConnectionType.COINBASE_WALLET)

  expect(cbConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('Install MetaMask')
  expect(injectedConnection.overrideActivate).toBeDefined()

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Coinbase and MetaMask Injected Desktop', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = { isCoinbaseWallet: true, isMetaMask: true }

  const { result: getConnection } = renderHook(() => useGetConnection())
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)
  const cbConnection = getConnection.current(ConnectionType.COINBASE_WALLET)

  expect(cbConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('MetaMask')
  expect(injectedConnection.overrideActivate).toBeUndefined()

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Generic Injected Desktop', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = { isTrustWallet: true }

  const { result: getConnection } = renderHook(() => useGetConnection())
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('Browser Wallet')
  expect(injectedConnection.overrideActivate).toBeUndefined()

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Generic Wallet Browser with delayed injection', async () => {
  UserAgentMock.isMobile = false
  global.window.ethereum = undefined

  const { result: getConnection } = renderHook(() => useGetConnection())
  const preInjectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(preInjectedConnection.shouldDisplay).toBe(true)
  expect(preInjectedConnection.name).toBe('Install MetaMask')

  global.window.ethereum = { isTrustWallet: true }
  const postInjectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(postInjectedConnection.shouldDisplay).toBe(true)
  expect(postInjectedConnection.name).toBe('Browser Wallet')
})

it('Generic Injected Mobile Browser', async () => {
  global.window.ethereum = { isTrustWallet: true }
  UserAgentMock.isMobile = true

  const { result: getConnection } = renderHook(() => useGetConnection())
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('Browser Wallet')
})

it('MetaMask Mobile Browser', async () => {
  global.window.ethereum = { isMetaMask: true }
  UserAgentMock.isMobile = true

  const { result: getConnection } = renderHook(() => useGetConnection())
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(injectedConnection.shouldDisplay).toBe(true)
  expect(injectedConnection.name).toBe('MetaMask')
  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(1)
})

it('Coinbase Mobile Browser', async () => {
  global.window.ethereum = { isCoinbaseWallet: true }
  UserAgentMock.isMobile = true

  const { result: getConnection } = renderHook(() => useGetConnection())
  const cbConnection = getConnection.current(ConnectionType.COINBASE_WALLET)

  expect(cbConnection.shouldDisplay).toBe(true)
  expect(cbConnection.overrideActivate).toBeUndefined()
  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(1)
})

it('Uninjected mWeb Browser', async () => {
  global.window.ethereum = undefined
  UserAgentMock.isMobile = true

  const { result: getConnection } = renderHook(() => useGetConnection())
  const uniConnection = getConnection.current(ConnectionType.UNIWALLET)
  const wcConnection = getConnection.current(ConnectionType.WALLET_CONNECT)
  const cbConnection = getConnection.current(ConnectionType.COINBASE_WALLET)
  const injectedConnection = getConnection.current(ConnectionType.INJECTED)

  expect(uniConnection.shouldDisplay).toBe(true)
  expect(wcConnection.shouldDisplay).toBe(true)
  // Don't show injected connection on plain mWeb browser
  expect(injectedConnection.shouldDisplay).toBe(false)
  // Expect coinbase option to launch coinbase app in a regular mobile browser
  expect(cbConnection.shouldDisplay).toBe(true)
  expect(cbConnection.overrideActivate).toBeDefined()

  expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(3)
})
