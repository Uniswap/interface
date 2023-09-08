import { Connector } from '@web3-react/types'
import UNIWALLET_ICON from 'assets/images/uniwallet.png'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { Connection, ConnectionType } from 'connection/types'
import { mocked } from 'test-utils/mocked'
import { createDeferredPromise } from 'test-utils/promise'
import { act, render } from 'test-utils/render'

import Option from './Option'

const mockToggleDrawer = jest.fn()
jest.mock('components/AccountDrawer')

beforeEach(() => {
  jest.spyOn(console, 'debug').mockReturnValue()
  mocked(useToggleAccountDrawer).mockReturnValue(mockToggleDrawer)
})


const mockConnection2: Connection = {
  getName: () => 'Mock Connection 2',
  connector: {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as Connector,
  getIcon: () => UNIWALLET_ICON,
  type: ConnectionType.INJECTED,
} as unknown as Connection

describe('Wallet Option', () => {
  
})
