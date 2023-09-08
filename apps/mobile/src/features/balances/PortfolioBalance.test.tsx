import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { Portfolios } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'
import {
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'

const mock: MockedResponse<PortfolioBalancesQuery> = {
  request: {
    query: PortfolioBalancesDocument,
    variables: {
      ownerAddress: Portfolios[0].ownerAddress,
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

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
