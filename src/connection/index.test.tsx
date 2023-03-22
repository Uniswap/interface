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

describe('connection utility/metadata tests', () => {
  const createWalletEnvironment = (ethereum: Window['window']['ethereum'], isMobile = false) => {
    UserAgentMock.isMobile = isMobile
    global.window.ethereum = ethereum

    const getConnection = renderHook(() => useGetConnection()).result.current
    const injected = getConnection(ConnectionType.INJECTED)
    const coinbase = getConnection(ConnectionType.COINBASE_WALLET)
    const uniswap = getConnection(ConnectionType.UNIWALLET)
    const walletconnect = getConnection(ConnectionType.WALLET_CONNECT)

    return { injected, coinbase, uniswap, walletconnect }
  }

  it('Non-injected Desktop', async () => {
    const { injected } = createWalletEnvironment(undefined)

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Install MetaMask')
    expect(injected.overrideActivate).toBeDefined()
    expect(injected.shouldDisplay).toBe(true)

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('MetaMask-Injected Desktop', async () => {
    const { injected } = createWalletEnvironment({ isMetaMask: true })

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('MetaMask')
    expect(injected.overrideActivate).toBeUndefined()
    expect(injected.shouldDisplay).toBe(true)

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('Coinbase-Injected Desktop', async () => {
    const { injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true })

    expect(coinbase.shouldDisplay).toBe(true)
    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Install MetaMask')
    expect(injected.overrideActivate).toBeDefined()

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('Coinbase and MetaMask Injected Desktop', async () => {
    const { injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true, isMetaMask: true })

    expect(coinbase.shouldDisplay).toBe(true)
    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('MetaMask')
    expect(injected.overrideActivate).toBeUndefined()

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('Generic Injected Desktop', async () => {
    const { injected } = createWalletEnvironment({ isTrustWallet: true })

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Browser Wallet')
    expect(injected.overrideActivate).toBeUndefined()

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('Generic Browser Wallet that injects as MetaMask', async () => {
    const { injected } = createWalletEnvironment({ isRabby: true, isMetaMask: true })

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Browser Wallet')
    expect(injected.overrideActivate).toBeUndefined()

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('Generic Wallet Browser with delayed injection', async () => {
    const { injected: preInjected } = createWalletEnvironment(undefined)

    expect(preInjected.shouldDisplay).toBe(true)
    expect(preInjected.name).toBe('Install MetaMask')

    const { injected: postInjected } = createWalletEnvironment({ isTrustWallet: true })

    expect(postInjected.shouldDisplay).toBe(true)
    expect(postInjected.name).toBe('Browser Wallet')
  })

  it('Generic Known Injected Wallet Browser', async () => {
    const { injected } = createWalletEnvironment({ isTrustWallet: true }, true)

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Browser Wallet')
    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(1)
  })

  const UNKNOWN_INJECTOR = { isRandomWallet: true } as Window['window']['ethereum']
  it('Generic Unknown Injected Wallet Browser', async () => {
    const { injected } = createWalletEnvironment(UNKNOWN_INJECTOR, true)

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('Browser Wallet')

    // Ensures we provide multiple connection options if in an unknown injected browser
    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(4)
  })

  it('MetaMask Mobile Browser', async () => {
    const { injected } = createWalletEnvironment({ isMetaMask: true }, true)

    expect(injected.shouldDisplay).toBe(true)
    expect(injected.name).toBe('MetaMask')
    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(1)
  })

  it('Coinbase Mobile Browser', async () => {
    const { coinbase } = createWalletEnvironment({ isCoinbaseWallet: true }, true)

    expect(coinbase.shouldDisplay).toBe(true)
    expect(coinbase.overrideActivate).toBeUndefined()
    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(1)
  })

  it('Uninjected mWeb Browser', async () => {
    const { injected, coinbase, uniswap, walletconnect } = createWalletEnvironment(undefined, true)

    expect(uniswap.shouldDisplay).toBe(true)
    expect(walletconnect.shouldDisplay).toBe(true)
    // Don't show injected connection on plain mWeb browser
    expect(injected.shouldDisplay).toBe(false)
    // Expect coinbase option to launch coinbase app in a regular mobile browser
    expect(coinbase.shouldDisplay).toBe(true)
    expect(coinbase.overrideActivate).toBeDefined()

    expect(getConnections(true).filter((c) => c.shouldDisplay).length).toEqual(3)
  })
})
