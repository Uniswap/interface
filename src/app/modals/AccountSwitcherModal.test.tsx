import React from 'react'
import { PreloadedState } from 'redux'
import { AccountSwitcher } from 'src/app/modals/AccountSwitcherModal'
import { RootState } from 'src/app/rootReducer'
import { initialModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { mockWalletPreloadedState } from 'src/test/fixtures'
import { render } from 'src/test/test-utils'

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: {
    ...initialModalState,
    [ModalName.AccountSwitcher]: { isOpen: true },
  },
} as unknown as PreloadedState<RootState>

// TODO [MOB-3961]: Figure out how to do snapshot tests when there is a BottomSheetModal
describe(AccountSwitcher, () => {
  it('renders correctly', () => {
    const tree = render(
      <AccountSwitcher
        onClose={() => {
          return
        }}
      />,
      { preloadedState }
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
