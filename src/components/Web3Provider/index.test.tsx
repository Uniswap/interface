import { act, render } from '@testing-library/react'
import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { MockEIP1193Provider } from '@web3-react/core'
import { Provider as EIP1193Provider } from '@web3-react/types'
import { sendAnalyticsEvent, user } from 'analytics'
import { connections, getConnection } from 'connection'
import { Connection, ConnectionType } from 'connection/types'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import store from 'state'
import { mocked } from 'test-utils/mocked'

import Web3Provider from '.'

jest.mock('analytics', () => ({
  useTrace: jest.fn(),
  sendAnalyticsEvent: jest.fn(),
  user: { set: jest.fn(), postInsert: jest.fn() },
}))
jest.mock('connection', () => {
  const { EIP1193 } = jest.requireActual('@web3-react/eip1193')
  const { initializeConnector, MockEIP1193Provider } = jest.requireActual('@web3-react/core')
  const { ConnectionType } = jest.requireActual('connection')
  const provider: EIP1193Provider = new MockEIP1193Provider()
  const [connector, hooks] = initializeConnector((actions: any) => new EIP1193({ actions, provider }))
  const mockConnection: Connection = {
    connector,
    hooks,
    getName: () => 'test',
    type: 'INJECTED' as ConnectionType,
    shouldDisplay: () => false,
  }

  return { ConnectionType, getConnection: jest.fn(), connections: [mockConnection] }
})

jest.unmock('@web3-react/core')

function first<T>(array: T[]): T {
  return array[0]
}

function last<T>(array: T[]): T {
  return array[array.length - 1]
}

const UI = (
  <HashRouter>
    <Provider store={store}>
      <Web3Provider>{null}</Web3Provider>
    </Provider>
  </HashRouter>
)

describe('Web3Provider', () => {
  it('renders and eagerly connects', async () => {
    const result = render(UI)
    await act(async () => {
      await result
    })
    expect(result).toBeTruthy()
  })

  describe('analytics', () => {
    let mockProvider: MockEIP1193Provider

    beforeEach(() => {
      const mockConnection = connections[0]
      mockProvider = mockConnection.connector.provider as MockEIP1193Provider
      mocked(getConnection).mockReturnValue(mockConnection)
      jest.spyOn(console, 'warn').mockImplementation()
    })

    it('sends event when the active account changes', async () => {
      // Arrange
      const result = render(UI)
      await act(async () => {
        await result
      })

      // Act
      act(() => {
        mockProvider.emitConnect('0x1')
        mockProvider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_type: 'test',
        is_reconnect: false,
        peer_wallet_agent: '(Injected)',
      })
      expect(first(mocked(sendAnalyticsEvent).mock.invocationCallOrder)).toBeGreaterThan(
        last(mocked(user.set).mock.invocationCallOrder)
      )
      expect(first(mocked(sendAnalyticsEvent).mock.invocationCallOrder)).toBeGreaterThan(
        last(mocked(user.postInsert).mock.invocationCallOrder)
      )
    })

    it('sends event with is_reconnect when a previous account reconnects', async () => {
      // Arrange
      const result = render(UI)
      await act(async () => {
        await result
      })

      // Act
      act(() => {
        mockProvider.emitConnect('0x1')
        mockProvider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })
      act(() => {
        mockProvider.emitAccountsChanged(['0x0000000000000000000000000000000000000001'])
      })
      act(() => {
        mockProvider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(3)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_type: 'test',
        is_reconnect: true,
        peer_wallet_agent: '(Injected)',
      })
    })
  })
})
