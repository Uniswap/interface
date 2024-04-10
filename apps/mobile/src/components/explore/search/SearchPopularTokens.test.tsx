import React from 'react'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { render, screen } from 'src/test/test-utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { ethToken, usdcToken, wethToken } from 'wallet/src/test/fixtures'
import { queryResolvers } from 'wallet/src/test/utils'

const { resolvers } = queryResolvers({
  topTokens: () => [wethToken(), usdcToken()],
  tokens: () => [ethToken({ address: undefined })],
})

describe(SearchPopularTokens, () => {
  // TODO(MOB-3146): this test is flaky
  jest.retryTimes(3)
  it.skip('renders without error', async () => {
    const tree = render(<SearchPopularTokens />, { resolvers })

    // Loading should show Token loader
    expect(screen.getAllByText('Token Full Name')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()

    // Success where WETH result in topTokens is replaced by ETH
    expect(await screen.findByText('ETH', {}, { timeout: ONE_SECOND_MS * 3 })).toBeDefined()
    expect(screen.getByText('USDC')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
