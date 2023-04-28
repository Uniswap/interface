import { Connector } from '@web3-react/types'
import UNIWALLET_ICON from 'assets/images/uniwallet.png'
import { useActivationState } from 'connection/activate'
import { Connection, ConnectionType } from 'connection/types'
import { act, render, renderHook } from 'test-utils/render'

import Option from './Option'

const mockConnection1: Connection = {
  getName: () => 'Mock Connection',
  connector: {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as Connector,
  getIcon: () => UNIWALLET_ICON,
  type: ConnectionType.UNIWALLET,
} as unknown as Connection

const mockConnection2: Connection = {
  getName: () => 'Mock Connection',
  connector: {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as Connector,
  getIcon: () => UNIWALLET_ICON,
  type: ConnectionType.INJECTED,
} as unknown as Connection

describe('Wallet Option', () => {
  it('renders default state', () => {
    const component = render(<Option connection={mockConnection1} />)
    const option = component.getByTestId('wallet-modal-option')

    expect(option).toMatchSnapshot()
  })

  it('renders pending state when selected', () => {
    const result = renderHook(useActivationState).result
    result.current.tryActivation(mockConnection1, jest.fn())

    const component = render(<Option connection={mockConnection1} />)
    const option = component.getByTestId('wallet-modal-option')
    act(() => option.click())

    expect(option).toMatchSnapshot()
  })

  it('renders disabled state when another connection is pending', () => {
    const result = renderHook(useActivationState).result
    result.current.tryActivation(mockConnection2, jest.fn())

    const component = render(<Option connection={mockConnection1} />)
    const option = component.getByTestId('wallet-modal-option')
    act(() => option.click())

    expect(option).toMatchSnapshot()
  })
})
