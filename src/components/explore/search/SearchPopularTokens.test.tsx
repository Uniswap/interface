import React from 'react'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { SearchPopularTokensDocument } from 'src/data/__generated__/types-and-hooks'
import { EthToken, TopTokens } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'

const mock = {
  request: {
    query: SearchPopularTokensDocument,
  },
  result: {
    data: {
      topTokens: TopTokens,
      eth: EthToken,
    },
  },
}

describe(SearchPopularTokens, () => {
  it('renders without error', async () => {
    const tree = render(<SearchPopularTokens />, { mocks: [mock] })

    // Loading should show Token loader
    expect(screen.getAllByText('Token Full Name')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()

    // Success where WETH result in topTokens is replaced by ETH
    expect(await screen.findByText('ETH')).toBeDefined()
    expect(screen.getByText('WBTC')).toBeDefined()
    expect(screen.getByText('USDC')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
