import React from 'react'
import { act } from 'react-test-renderer'
import { PreloadedState } from 'redux'
import { AccountSwitcher } from 'src/app/modals/AccountSwitcherModal'
import { MobileState } from 'src/app/reducer'
import { initialModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { render } from 'src/test/test-utils'
import { mockWalletPreloadedState } from 'wallet/src/test/fixtures'
import { noOpFunction } from 'wallet/src/test/utils'

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: {
    ...initialModalState,
    [ModalName.AccountSwitcher]: { isOpen: true },
  },
} as unknown as PreloadedState<MobileState>

// TODO [MOB-259]: Figure out how to do snapshot tests when there is a BottomSheetModal
describe(AccountSwitcher, () => {
  it('renders correctly', async () => {
    const tree = render(<AccountSwitcher onClose={noOpFunction} />, { preloadedState })

    await act(async () => {
      // Wait until the component is rendered
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
