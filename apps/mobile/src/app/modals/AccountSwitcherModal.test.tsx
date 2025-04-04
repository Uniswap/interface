import React from 'react'
import { AccountSwitcher } from 'src/app/modals/AccountSwitcherModal'
import { preloadedMobileState, preloadedModalsState } from 'src/test/fixtures'
import { cleanup, render } from 'src/test/test-utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { noOpFunction } from 'utilities/src/test/utils'
import { ACCOUNT } from 'wallet/src/test/fixtures'

const preloadedState = preloadedMobileState({
  account: ACCOUNT,
  modals: preloadedModalsState({
    [ModalName.AccountSwitcher]: { isOpen: true },
  }),
})

// TODO [MOB-259]: Figure out how to do snapshot tests when there is a Modal
describe(AccountSwitcher, () => {
  it('renders correctly', async () => {
    const tree = render(<AccountSwitcher onClose={noOpFunction} />, { preloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
    cleanup()
  })
})
