import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { AccountList } from 'src/components/accounts/AccountList'
import { render, screen } from 'src/test/test-utils'
import { NumberType } from 'utilities/src/format/types'
import { Resolvers } from 'wallet/src/data/__generated__/types-and-hooks'
import { ACCOUNT, ON_PRESS_EVENT_PAYLOAD, amounts } from 'wallet/src/test/fixtures'
import { mockLocalizedFormatter } from 'wallet/src/test/mocks'

const resolvers: Resolvers = {
  Portfolio: {
    tokensTotalDenominatedValue: () => amounts.md(),
  },
}

describe(AccountList, () => {
  it('renders without error', async () => {
    const tree = render(<AccountList accounts={[ACCOUNT]} onPress={jest.fn()} />, { resolvers })

    expect(
      await screen.findByText(
        mockLocalizedFormatter.formatNumberOrString({
          value: amounts.md().value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
    ).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('handles press on card items', async () => {
    const onPressSpy = jest.fn()
    render(<AccountList accounts={[ACCOUNT]} onPress={onPressSpy} />, {
      resolvers,
    })
    // go to success state
    expect(
      await screen.findByText(
        mockLocalizedFormatter.formatNumberOrString({
          value: amounts.md().value,
          type: NumberType.PortfolioBalance,
          currencyCode: 'usd',
        })
      )
    ).toBeDefined()

    fireEvent.press(screen.getByTestId(`account_item/${ACCOUNT.address}`), ON_PRESS_EVENT_PAYLOAD)

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })
})
