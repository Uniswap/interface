import { MockedResponse } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { AccountList } from 'src/components/accounts/AccountList'
import { ON_PRESS_EVENT_PAYLOAD } from 'src/components/buttons/TouchableArea.test'
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
      <AccountList accounts={[account]} onPress={jest.fn()} onPressEdit={jest.fn()} />,
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

  it('handles press on card items', async () => {
    const onPressSpy = jest.fn()
    render(<AccountList accounts={[account]} onPress={onPressSpy} onPressEdit={jest.fn()} />, {
      mocks: [mock],
    })
    // go to success state
    expect(
      await screen.findByText(
        formatUSDPrice(
          Portfolios[0].tokensTotalDenominatedValue?.value,
          NumberType.PortfolioBalance
        )
      )
    ).toBeDefined()
    fireEvent.press(screen.getByTestId(`account_item/${account.address}`), ON_PRESS_EVENT_PAYLOAD)

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })
})
