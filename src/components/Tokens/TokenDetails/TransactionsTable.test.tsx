import { screen } from '@testing-library/react'
import { ChainId, Token } from '@uniswap/sdk-core'
import { render } from 'test-utils/render'

import { TransactionsTable } from './TransactionsTable'

describe('TransactionsTable', () => {
  const mockToken = new Token(
    1,
    '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
    18,
    'BITCOIN',
    'HarryPotterObamaSonic10Inu'
  )

  it('displays swap transaction', () => {
    window.innerWidth = 1280
    const txHash = '0xc3e8878f48b4c5048fef4988136b1cad4401b77f36f0e034e4e97929df85fb5e'

    const { asFragment } = render(<TransactionsTable chainId={ChainId.MAINNET} referenceToken={mockToken} />)

    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('09/06, 05:09pm')).toBeInTheDocument()
    expect(screen.getAllByText('Buy')[0]).toBeInTheDocument()
    expect(screen.getByText('6,084.98')).toBeInTheDocument()
    expect(screen.getByText('39,037.94 DORKL')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByTestId(`https://etherscan.io/tx/${txHash}`)).toHaveAttribute(
      'href',
      `https://etherscan.io/tx/${txHash}`
    )
  })
})
