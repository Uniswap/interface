import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import {
  PortfolioBalanceDocument,
  PortfolioBalanceQuery,
} from 'src/data/__generated__/types-and-hooks'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { Portfolios } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import { formatUSDPrice, NumberType } from 'src/utils/format'

const mock: MockedResponse<PortfolioBalanceQuery> = {
  request: {
    query: PortfolioBalanceDocument,
    variables: {
      owner: Portfolios[0].ownerAddress,
    },
  },
  result: {
    data: {
      portfolios: Portfolios,
    },
  },
}

describe(PortfolioBalance, () => {
  it('renders without error', async () => {
    const tree = render(<PortfolioBalance owner={Portfolios[0].ownerAddress} />, { mocks: [mock] })

    // loading
    expect(await screen.findByText('$000.00')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()

    // success
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
