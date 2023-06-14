import { act, render } from '@testing-library/react'
import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { initializeConnector, MockEIP1193Provider } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
import { Provider as EIP1193Provider } from '@web3-react/types'
import { getConnection } from 'connection'
import { Connection, ConnectionType } from 'connection/types'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import store from 'state'
import { mocked } from 'test-utils/mocked'

import Web3Provider from '.'

jest.mock('@uniswap/analytics', () => ({
  sendAnalyticsEvent: jest.fn(),
  user: { set: jest.fn(), postInsert: jest.fn() },
}))
jest.mock('connection', () => {
  const { ConnectionType } = jest.requireActual('connection')
  return { ConnectionType, getConnection: jest.fn() }
})
jest.mock('hooks/useEagerlyConnect', () => jest.fn())
jest.mock('hooks/useOrderedConnections', () => jest.fn())

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
  let provider: MockEIP1193Provider & EIP1193Provider
  let connection: Connection

  beforeEach(() => {
    provider = new MockEIP1193Provider() as MockEIP1193Provider & EIP1193Provider
    const [connector, hooks] = initializeConnector((actions) => new EIP1193({ actions, provider }))
    connection = {
      connector,
      hooks,
      getName: jest.fn().mockReturnValue('test'),
      type: 'INJECTED' as ConnectionType,
      shouldDisplay: () => false,
    }
    mocked(useOrderedConnections).mockReturnValue([connection])
  })

  it('renders and eagerly connects', async () => {
    const result = render(UI)
    await act(async () => {
      await result
    })
    expect(useEagerlyConnect).toHaveBeenCalled()
    expect(result).toBeTruthy()
  })

  describe('analytics', () => {
    beforeEach(() => {
      mocked(getConnection).mockReturnValue(connection)
    })

    it('sends event when the active account changes', async () => {
      // Arrange
      const result = render(UI)
      await act(async () => {
        await result
      })

      // Act
      act(() => {
        provider.emitConnect('0x1')
        provider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
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
        provider.emitConnect('0x1')
        provider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })
      act(() => {
        provider.emitAccountsChanged(['0x0000000000000000000000000000000000000001'])
      })
      act(() => {
        provider.emitAccountsChanged(['0x0000000000000000000000000000000000000000'])
      })

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(3)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_type: 'test',
        is_reconnect: true,
        peer_wallet_agent: '(Injected)',
      })
    })
  })
})
