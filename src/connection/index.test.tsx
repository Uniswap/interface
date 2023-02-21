// eslint-disable-next-line jest/no-export
export {}

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

it('Non-injected Desktop', async () => {
  jest.mock('connection/utils', () => ({ isInjected: false, isMetaMaskWallet: false, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: false }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('MetaMask')
  expect(connection.injectedConnection.overrideActivate).toBeDefined()
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('MetaMask Injected Desktop', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: true, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: false }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('MetaMask')
  expect(connection.injectedConnection.overrideActivate).toBeUndefined()
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Coinbase Injected Desktop', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: false, isCoinbaseWallet: true }))
  jest.mock('utils/userAgent', () => ({ isMobile: false }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('MetaMask')
  expect(connection.injectedConnection.overrideActivate).toBeDefined()
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Coinbase and MetaMask Injected Desktop', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: true, isCoinbaseWallet: true }))
  jest.mock('utils/userAgent', () => ({ isMobile: false }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('MetaMask')
  expect(connection.injectedConnection.overrideActivate).toBeUndefined()
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Generic Injected Desktop', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: false, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: false }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('Browser Wallet')
  expect(connection.injectedConnection.overrideActivate).toBeUndefined()
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(4)
})

it('Generic Injected Mobile Browser', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: false, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: true }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('Browser Wallet')
})

it('MetaMask Mobile Browser', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: true, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: true }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(true)
  expect(connection.injectedConnection.name).toBe('MetaMask')
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(1)
})

it('Coinbase Mobile Browser', async () => {
  jest.mock('connection/utils', () => ({ isInjected: true, isMetaMaskWallet: false, isCoinbaseWallet: true }))
  jest.mock('utils/userAgent', () => ({ isMobile: true }))
  const connection = await import('connection')

  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.coinbaseWalletConnection.overrideActivate).toBeUndefined()
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(1)
})

it('mWeb Browser', async () => {
  jest.mock('connection/utils', () => ({ isInjected: false, isMetaMaskWallet: false, isCoinbaseWallet: false }))
  jest.mock('utils/userAgent', () => ({ isMobile: true }))
  const connection = await import('connection')
  expect(connection.injectedConnection.shouldDisplay).toBe(false)
  expect(connection.coinbaseWalletConnection.shouldDisplay).toBe(true)
  expect(connection.coinbaseWalletConnection.overrideActivate).toBeDefined()
  expect(connection.uniwalletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.walletConnectConnection.shouldDisplay).toBe(true)
  expect(connection.CONNECTIONS.filter((c) => c.shouldDisplay).length).toEqual(3)
})
