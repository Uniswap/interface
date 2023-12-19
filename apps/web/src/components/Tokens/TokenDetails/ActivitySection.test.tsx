import { screen } from '@testing-library/react'
import { ChainId, Token } from '@uniswap/sdk-core'
import { render } from 'test-utils/render'

import { ActivitySection } from './ActivitySection'

const mockToken = new Token(1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18, 'WETH', 'Wrapped Ether')

describe('ActivitySection', () => {
  it('has Pools and Transactions tabs', () => {
    render(<ActivitySection chainId={ChainId.MAINNET} referenceToken={mockToken} />)

    expect(screen.getByText('Pools')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })
})
