import { act, render } from '@testing-library/react'
import { initializeConnector } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
// TODO(INFRA-163): Export MockEIP1193Provider from @web3-react/eip1193 to facilitate testing.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { MockEIP1193Provider } from '@web3-react/eip1193/dist/mock'
import { Provider as EIP1193Provider } from '@web3-react/types'
import { Connection, ConnectionType } from 'connection'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import { Provider } from 'react-redux'
import store from 'state'
import { asMock } from 'test-utils'

import Web3Provider from '.'

jest.mock('hooks/useEagerlyConnect', () => jest.fn())
jest.mock('hooks/useOrderedConnections', () => jest.fn())

const UI = (
  <Provider store={store}>
    <Web3Provider>{null}</Web3Provider>
  </Provider>
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
    asMock(useOrderedConnections).mockReturnValue([connection])
  })

  it('renders', async () => {
    const result = render(UI)
    await act(async () => {
      await result
    })
    expect(useEagerlyConnect).toHaveBeenCalled()
    expect(result).toBeTruthy()
  })
})
