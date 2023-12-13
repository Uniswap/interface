import { MockEIP1193Provider } from '@web3-react/core'
import { EIP6963_PROVIDER_MANAGER } from 'connection/eip6963/providers'
import { EIP6963Event, EIP6963ProviderInfo } from 'connection/eip6963/types'
import { getRecentConnectionMeta } from 'connection/meta'
import { ConnectionType } from 'connection/types'
import { useEip6963Enabled } from 'featureFlags/flags/eip6963'
import { useAppDispatch } from 'state/hooks'
import { updateRecentConnectionMeta } from 'state/user/reducer'
import { mocked } from 'test-utils/mocked'
import { act, render, renderHook } from 'test-utils/render'
import { v4 as uuidv4 } from 'uuid'

import { useOrderedConnections } from './useOrderedConnections'

const listenersToClearAfterTests: (() => void)[] = []

afterEach(() => {
  listenersToClearAfterTests.forEach((listener) => window.removeEventListener(EIP6963Event.REQUEST_PROVIDER, listener))
  listenersToClearAfterTests.length = 0

  // @ts-ignore
  EIP6963_PROVIDER_MANAGER._map.clear() // reset the map after each test
  // @ts-ignore
  EIP6963_PROVIDER_MANAGER._list.length = 0 // reset the list after each test
})

function announceProvider(rdns: string, provider: MockEIP1193Provider) {
  const info: EIP6963ProviderInfo = {
    name: rdns,
    rdns,
    icon: "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    uuid: uuidv4(),
  }

  const detail = Object.freeze({ info, provider })

  const announce = () => {
    window.dispatchEvent(
      new CustomEvent(EIP6963Event.ANNOUNCE_PROVIDER, {
        detail,
      })
    )
  }

  announce()

  window.addEventListener(EIP6963Event.REQUEST_PROVIDER, announce)

  listenersToClearAfterTests.push(announce)
}

jest.mock('connection/meta')
jest.mock('featureFlags/flags/eip6963')

beforeEach(() => {
  mocked(useEip6963Enabled).mockReturnValue(true)
  mocked(getRecentConnectionMeta).mockReturnValue({
    type: ConnectionType.EIP_6963_INJECTED,
    rdns: 'MetaMask',
  })
})

describe('Ordered Connections', () => {
  it('should show backup injection ui if window.ethereum is injected by a non-eip6963 wallet', () => {
    const mockProvider = new MockEIP1193Provider()

    announceProvider('Non_Metamask_Wallet', mockProvider)
    globalThis.window.ethereum = { isMetaMask: true } as any

    const test = renderHook(() => useOrderedConnections())

    expect(test.result.current.orderedConnections.length).toEqual(4)
    expect(test.result.current.showDeprecatedMessage).toEqual(true)
  })

  it('should not show backup injection ui if window.ethereum is injected by an eip6963 wallet', () => {
    const mockProvider = new MockEIP1193Provider()
    ;(mockProvider as any).isMetaMask = true // force mock provider to be MetaMask

    announceProvider('MetaMask', mockProvider)
    globalThis.window.ethereum = mockProvider as Window['window']['ethereum'] // use same MetaMask provider for deprecated and eip6963 injection

    const test = renderHook(() => useOrderedConnections())

    expect(test.result.current.orderedConnections.length).toEqual(4)
    expect(test.result.current.showDeprecatedMessage).toEqual(false)
  })

  it('should show deprecated injection button if no eip6963 injectors are present', () => {
    const mockProvider = new MockEIP1193Provider()
    globalThis.window.ethereum = mockProvider as Window['window']['ethereum']

    const test = renderHook(() => useOrderedConnections())
    const item2 = render(test.result.current.orderedConnections[1])

    expect(item2.getByText('Browser Wallet')).toBeInTheDocument()
  })

  it('should order recent connection first, then uniswap wallet, then eip6963 wallets, then rest', () => {
    const mockProvider = new MockEIP1193Provider()
    announceProvider('MetaMask', mockProvider)
    announceProvider('OtherWallet', mockProvider)

    const {
      result: { current: dispatch },
    } = renderHook(() => useAppDispatch())

    act(() => dispatch(updateRecentConnectionMeta({ type: ConnectionType.EIP_6963_INJECTED, rdns: 'MetaMask' })))

    const test = renderHook(() => useOrderedConnections())
    expect(test.result.current.orderedConnections.length).toEqual(5)
    const item1 = render(test.result.current.orderedConnections[0])

    expect(item1.getByText('MetaMask')).toBeInTheDocument()
    expect(item1.getByText('Recent')).toBeInTheDocument()

    const item2 = render(test.result.current.orderedConnections[1])
    expect(item2.getByText('Uniswap Wallet')).toBeInTheDocument() // Uniswap wallet should come second under recent

    const item3 = render(test.result.current.orderedConnections[2])
    expect(item3.getByText('OtherWallet')).toBeInTheDocument() // Remaining eip6963 wallets should come under recent

    const item4 = render(test.result.current.orderedConnections[3])
    expect(item4.getByText('WalletConnect')).toBeInTheDocument()
    const item5 = render(test.result.current.orderedConnections[4])
    expect(item5.getByText('Coinbase Wallet')).toBeInTheDocument()
  })
})
