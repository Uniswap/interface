import { MockedProvider } from '@apollo/client/testing'
import React from 'react'
import { PortfolioBalanceDocument } from 'src/data/__generated__/types-and-hooks'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { account } from 'src/test/fixtures'
import { Amounts } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import { formatUSDPrice, NumberType } from 'src/utils/format'

const mocks = [
  {
    request: {
      query: PortfolioBalanceDocument,
      variables: {
        owner: account.address,
      },
    },
    result: {
      data: {
        portfolios: [
          {
            tokensTotalDenominatedValue: Amounts.md,
            tokensTotalDenominatedValueChange: {
              absolute: Amounts.sm,
              percentage: Amounts.xs,
            },
          },
        ],
      },
    },
  },
]

it('renders without error', async () => {
  const tree = render(
    <MockedProvider addTypename={false} mocks={mocks}>
      <PortfolioBalance owner={account.address} />
    </MockedProvider>
  )

  expect(await screen.findByText('$000.00')).toBeDefined()
  expect(tree.toJSON()).toMatchSnapshot()
  expect(
    await screen.findByText(formatUSDPrice(Amounts.md.value, NumberType.PortfolioBalance))
  ).toBeDefined()
  expect(tree.toJSON()).toMatchSnapshot()
})
