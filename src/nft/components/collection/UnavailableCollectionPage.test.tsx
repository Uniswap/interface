import { render, screen } from 'test-utils/render'

import { UnavailableCollectionPage } from './UnavailableCollectionPage'

describe('Nonexistent Collection', () => {
  it('displays informative message', () => {
    render(<UnavailableCollectionPage />)
    expect(screen.getByText('No collection assets exist at this address')).toBeInTheDocument()
  })

  it('has a hyperlink back to the Explore page', () => {
    render(<UnavailableCollectionPage />)
    expect(screen.getByText('Return to NFT Explore')).toHaveAttribute('href', '/nfts')
  })
})

describe('Blocked Collection', () => {
  it('displays warning icon and informative message', () => {
    render(<UnavailableCollectionPage isBlocked />)
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    expect(screen.getByText('This collection is blocked')).toBeInTheDocument()
  })

  it('has hyperlinks to learn more and return to the Explore page', () => {
    render(<UnavailableCollectionPage isBlocked />)
    expect(screen.getByText('Learn why')).toHaveAttribute(
      'href',
      'https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy'
    )
    expect(screen.getByText('Return to NFT Explore')).toHaveAttribute('href', '/nfts')
  })
})
