import React from 'react'
import { AccountSwitcher } from 'src/app/modals/AccountSwitcherModal'
import { preloadedMobileState, preloadedModalsState } from 'src/test/fixtures'
import { cleanup, render } from 'src/test/test-utils'
import { ModalName } from 'wallet/src/telemetry/constants'
import { ACCOUNT } from 'wallet/src/test/fixtures'
import { noOpFunction } from 'wallet/src/test/mocks'

const preloadedState = preloadedMobileState({
  account: ACCOUNT,
  modals: preloadedModalsState({
    [ModalName.AccountSwitcher]: { isOpen: true },
  }),
})

// TODO [MOB-259]: Figure out how to do snapshot tests when there is a BottomSheetModal
describe(AccountSwitcher, () => {
  it('renders correctly', async () => {
    const tree = render(<AccountSwitcher onClose={noOpFunction} />, { preloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
    cleanup()
  })
})
