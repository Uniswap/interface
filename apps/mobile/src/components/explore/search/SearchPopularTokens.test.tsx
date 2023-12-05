import React from 'react'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { EthToken, TopNFTCollections, TopTokens } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import {
  SearchPopularNftCollectionsDocument,
  SearchPopularTokensDocument,
} from 'wallet/src/data/__generated__/types-and-hooks'

const TokensMock = {
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

const NFTsMock = {
  request: {
    query: SearchPopularNftCollectionsDocument,
  },
  result: {
    data: {
      topCollections: TopNFTCollections,
    },
  },
}

describe(SearchPopularTokens, () => {
  it('renders without error', async () => {
    const tree = render(<SearchPopularTokens />, { mocks: [TokensMock, NFTsMock] })

    // Loading should show Token loader
    expect(screen.getAllByText('Token Full Name')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()

    // Success where WETH result in topTokens is replaced by ETH
    expect(await screen.findByText('ETH')).toBeDefined()
    expect(screen.getByText('USDC')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
