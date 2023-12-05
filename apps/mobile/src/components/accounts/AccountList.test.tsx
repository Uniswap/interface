import { MockedResponse } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { AccountList } from 'src/components/accounts/AccountList'
import { ON_PRESS_EVENT_PAYLOAD } from 'src/test/eventFixtures'
import { Portfolios } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import { NumberType } from 'utilities/src/format/types'
import {
  AccountListDocument,
  AccountListQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { account } from 'wallet/src/test/fixtures'
import { mockLocalizedFormatter } from 'wallet/src/test/utils'

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
    const tree = render(<AccountList accounts={[account]} onPress={jest.fn()} />, { mocks: [mock] })

    expect(
      await screen.findByText(
        mockLocalizedFormatter.formatNumberOrString({
          value: Portfolios[0].tokensTotalDenominatedValue?.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
    ).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('handles press on card items', async () => {
    const onPressSpy = jest.fn()
    render(<AccountList accounts={[account]} onPress={onPressSpy} />, {
      mocks: [mock],
    })
    // go to success state
    expect(
      await screen.findByText(
        mockLocalizedFormatter.formatNumberOrString({
          value: Portfolios[0].tokensTotalDenominatedValue?.value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
    ).toBeDefined()

    await fireEvent.press(
      screen.getByTestId(`account_item/${account.address}`),
      ON_PRESS_EVENT_PAYLOAD
    )

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })
})
