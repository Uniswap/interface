import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import { AccountList } from 'src/components/accounts/AccountList'
import { AccountListDocument, AccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { account } from 'src/test/fixtures'
import { Portfolios } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import { formatUSDPrice, NumberType } from 'src/utils/format'

jest.mock('@react-navigation/drawer', () => ({ useDrawerStatus: jest.fn(() => 'unknown') }))

const mock: MockedResponse<AccountListQuery> = {
  request: {
    query: AccountListDocument,
    variables: {
      addresses: [account.address],
    },
  },
  result: {
    data: {
      portfolios: Portfolios,
    },
  },
}

describe(AccountList, () => {
  it('renders without error', async () => {
    const tree = render(
      <AccountList
        accounts={[account]}
        onAddWallet={function (): void {
          throw new Error('Function not implemented.')
        }}
      />,
      { mocks: [mock] }
    )

    expect(
      await screen.findByText(
        formatUSDPrice(
          Portfolios[0].tokensTotalDenominatedValue?.value,
          NumberType.PortfolioBalance
        )
      )
    ).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
