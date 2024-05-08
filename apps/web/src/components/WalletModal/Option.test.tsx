import { Connector } from '@web3-react/types'
import UNIWALLET_ICON from 'assets/images/uniwallet.png'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Connection, ConnectionType } from 'connection/types'
import { mocked } from 'test-utils/mocked'
import { createDeferredPromise } from 'test-utils/promise'
import { act, render } from 'test-utils/render'

import Option from './Option'

const mockToggleDrawer = jest.fn()
jest.mock('components/AccountDrawer/MiniPortfolio/hooks')

beforeEach(() => {
  jest.spyOn(console, 'debug').mockReturnValue()
  mocked(useToggleAccountDrawer).mockReturnValue(mockToggleDrawer)
})

const mockConnection1: Connection = {
  getProviderInfo: () => ({ name: 'Mock Connection 1', icon: UNIWALLET_ICON }),
  connector: {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as Connector,
  type: ConnectionType.UNISWAP_WALLET_V2,
} as unknown as Connection

const mockConnection2: Connection = {
  getProviderInfo: () => ({ name: 'Mock Connection 2', icon: UNIWALLET_ICON }),
  connector: {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as Connector,
  type: ConnectionType.INJECTED,
} as unknown as Connection

describe('Wallet Option', () => {
  it('renders default state', () => {
    const component = render(<Option connection={mockConnection1} />)
    const option = component.getByTestId('wallet-option-UNISWAP_WALLET_V2')
    expect(option).toBeEnabled()
    expect(option).toHaveProperty('selected', false)

    expect(option).toMatchSnapshot()
  })

  it('connect when clicked', async () => {
    const activationResponse = createDeferredPromise()
    mocked(mockConnection1.connector.activate).mockReturnValue(activationResponse.promise)

    const component = render(
      <>
        <Option connection={mockConnection1} />
        <Option connection={mockConnection2} />
      </>
    )
    const option1 = component.getByTestId('wallet-option-UNISWAP_WALLET_V2')
    const option2 = component.getByTestId('wallet-option-INJECTED')

    expect(option1).toBeEnabled()
    expect(option1).toHaveProperty('selected', false)
    expect(option2).toBeEnabled()
    expect(option2).toHaveProperty('selected', false)

    expect(mockConnection1.connector.activate).toHaveBeenCalledTimes(0)
    act(() => option1.click())
    expect(mockConnection1.connector.activate).toHaveBeenCalledTimes(1)

    expect(option1).toBeDisabled()
    expect(option1).toHaveProperty('selected', true)
    expect(option2).toBeDisabled()
    expect(option2).toHaveProperty('selected', false)

    await act(async () => activationResponse.resolve())

    expect(option1).toBeEnabled()
    expect(option1).toHaveProperty('selected', false)
    expect(option2).toBeEnabled()
    expect(option2).toHaveProperty('selected', false)
  })
})
