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

    const displayed = getConnections().filter((c) => c.shouldDisplay())
    const getConnection = renderHook(() => useGetConnection()).result.current
    const injected = getConnection(ConnectionType.INJECTED)
    const coinbase = getConnection(ConnectionType.COINBASE_WALLET)
    const uniswap = getConnection(ConnectionType.UNIWALLET)
    const walletconnect = getConnection(ConnectionType.WALLET_CONNECT)

    return { displayed, injected, coinbase, uniswap, walletconnect }
  }

  it('Non-injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment(undefined)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(4)
  })

  it('MetaMask-Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Coinbase-Injected Desktop', async () => {
    const { displayed, injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true })

    expect(displayed.includes(coinbase)).toBe(true)
    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(4)
  })

  it('Coinbase and MetaMask Injected Desktop', async () => {
    const { displayed, injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true, isMetaMask: true })

    expect(displayed.includes(coinbase)).toBe(true)
    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isTrustWallet: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Browser Wallet that injects as MetaMask', async () => {
    const { displayed, injected } = createWalletEnvironment({ isRabby: true, isMetaMask: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Wallet Browser with delayed injection', async () => {
    const { injected } = createWalletEnvironment(undefined)

    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    createWalletEnvironment({ isTrustWallet: true })

    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()
  })

  const UNKNOWN_INJECTOR = { isRandomWallet: true } as Window['window']['ethereum']
  it('Generic Unknown Injected Wallet Browser', async () => {
    const { displayed, injected } = createWalletEnvironment(UNKNOWN_INJECTOR, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    // Ensures we provide multiple connection options if in an unknown injected browser
    expect(displayed.length).toEqual(4)
  })

  it('MetaMask Mobile Browser', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true }, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()
    expect(displayed.length).toEqual(1)
  })

  it('Coinbase Mobile Browser', async () => {
    const { displayed, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true }, true)

    expect(displayed.includes(coinbase)).toBe(true)
    // Expect coinbase option to not override activation in a the cb mobile browser
    expect(coinbase.overrideActivate?.()).toBeFalsy()
    expect(displayed.length).toEqual(1)
  })

  it('Uninjected mWeb Browser', async () => {
    const { displayed, injected, coinbase, walletconnect } = createWalletEnvironment(undefined, true)

    expect(displayed.includes(coinbase)).toBe(true)
    expect(displayed.includes(walletconnect)).toBe(true)
    // Don't show injected connection on plain mWeb browser
    expect(displayed.includes(injected)).toBe(false)
    // Expect coinbase option to launch coinbase app in a regular mobile browser
    expect(coinbase.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(3)
  })
})
