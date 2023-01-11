import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types'
import { DrawerNavigationState, ParamListBase } from '@react-navigation/routers'
import React from 'react'
import { PreloadedState } from 'redux'
import { AccountDrawer } from 'src/app/navigation/AccountDrawer'
import { RootState } from 'src/app/rootReducer'
import { initialModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { mockWalletPreloadedState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'

jest.mock('@react-navigation/drawer', () => ({
  useDrawerStatus: jest.fn().mockImplementation(() => 'open'),
}))

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: {
    ...initialModalState,
    [ModalName.AccountSwitcher]: { isOpen: true },
  },
} as unknown as PreloadedState<RootState>

describe(AccountDrawer, () => {
  it('renders correctly', () => {
    const tree = renderWithProviders(
      <AccountDrawer
        descriptors={{} as DrawerDescriptorMap}
        navigation={{} as DrawerNavigationHelpers}
        state={{} as DrawerNavigationState<ParamListBase>}
      />,
      {
        preloadedState,
      }
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
