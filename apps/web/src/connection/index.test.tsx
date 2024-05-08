import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/wallets/browser-wallet-light.svg'
import { connections, getConnection } from 'connection'

import { ConnectionType } from './types'

const UserAgentMock = jest.requireMock('uniswap/src/utils/platform')
jest.mock('uniswap/src/utils/platform', () => ({
  isMobile: false,
}))

describe('connection utility/metadata tests', () => {
  beforeEach(() => {
    globalThis.window.ethereum = undefined
  })

  const createWalletEnvironment = (ethereum: Window['window']['ethereum'], isMobile = false) => {
    UserAgentMock.isMobile = isMobile
    globalThis.window.ethereum = ethereum

    const displayed = connections.filter((c) => c.shouldDisplay())
    const injected = getConnection(ConnectionType.INJECTED)
    const coinbase = getConnection(ConnectionType.COINBASE_WALLET)
    const uniswap = getConnection(ConnectionType.UNISWAP_WALLET_V2)
    const walletconnect = getConnection(ConnectionType.WALLET_CONNECT_V2)

    return { displayed, injected, coinbase, uniswap, walletconnect }
  }

  it('Non-injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment(undefined)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Install MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(4)
  })

  it('MetaMask-Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Coinbase-Injected Desktop', async () => {
    const { displayed, injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true })

    expect(displayed.includes(coinbase)).toBe(true)
    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Install MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(4)
  })

  it('Coinbase and MetaMask Injected Desktop', async () => {
    const { displayed, injected, coinbase } = createWalletEnvironment({ isCoinbaseWallet: true, isMetaMask: true })

    expect(displayed.includes(coinbase)).toBe(true)
    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Trust Wallet Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isTrust: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Trust Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Rabby Wallet Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isRabby: true, isMetaMask: true }) // Rabby sets isMetaMask to true

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Rabby')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('LedgerConnect Wallet Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isLedgerConnect: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Ledger')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Brave Browser Wallet Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isBraveWallet: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Brave')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  const UNKNOWN_MM_INJECTOR = { isRandomWallet: true, isMetaMask: true } as Window['window']['ethereum']
  it('Generic Browser Wallet that injects as MetaMask', async () => {
    const { displayed, injected } = createWalletEnvironment(UNKNOWN_MM_INJECTOR)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  const UNKNOWN_INJECTOR = { isRandomWallet: true } as Window['window']['ethereum']
  it('Generic Unknown Injected Wallet Browser', async () => {
    const { displayed, injected } = createWalletEnvironment(UNKNOWN_INJECTOR, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(injected.getProviderInfo(/* isDarkMode= */ false).icon).toBe(INJECTED_LIGHT_ICON)
    expect(injected.getProviderInfo(/* isDarkMode= */ true).icon).toBe(INJECTED_DARK_ICON)

    // Ensures we provide multiple connection options if in an unknown injected browser
    expect(displayed.length).toEqual(4)
  })

  it('Generic Wallet Browser with delayed injection', async () => {
    const { injected } = createWalletEnvironment(undefined)

    expect(injected.getProviderInfo().name).toBe('Install MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    createWalletEnvironment(UNKNOWN_INJECTOR)

    expect(injected.getProviderInfo().name).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()
  })

  it('MetaMask Mobile Browser', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true }, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getProviderInfo().name).toBe('MetaMask')
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
