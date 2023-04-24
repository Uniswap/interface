import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import { PreloadedState } from 'redux'
import { AccountSwitcher } from 'src/app/modals/AccountSwitcherModal'
import { RootState } from 'src/app/rootReducer'
import { AccountListDocument, AccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { initialModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { ACCOUNT_ADDRESS_ONE, mockWalletPreloadedState } from 'src/test/fixtures'
import { Portfolios } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'

jest.useFakeTimers()

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: {
    ...initialModalState,
    [ModalName.AccountSwitcher]: { isOpen: true },
  },
} as unknown as PreloadedState<RootState>

const AccountListMock: MockedResponse<AccountListQuery> = {
  request: {
    query: AccountListDocument,
    variables: {
      addresses: [ACCOUNT_ADDRESS_ONE],
    },
  },
  result: {
    data: {
      portfolios: Portfolios,
    },
  },
}

// TODO [MOB-3961]: Figure out how to do snapshot tests when there is a BottomSheetModal
describe(AccountSwitcher, () => {
  it('renders correctly', () => {
    const tree = render(
      <AccountSwitcher
        onClose={(): void => {
          return
        }}
      />,
      { preloadedState, mocks: [AccountListMock] }
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
