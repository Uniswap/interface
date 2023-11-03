import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Token } from '@uniswap/sdk-core'
import { render } from 'test-utils/render'

import { ActivitySection } from './ActivitySection'

const mockToken = new Token(
  1,
  '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
  18,
  'BITCOIN',
  'HarryPotterObamaSonic10Inu'
)

describe('ActivitySection', () => {
  it('has Pools and Transactions tabs', () => {
    render(<ActivitySection referenceToken={mockToken} />)

    expect(screen.getByText('Pools')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('lets user navigate between tabs', async () => {
    render(<ActivitySection referenceToken={mockToken} />)
    expect(screen).not.toContain('Tx')

    const transactionsTab = screen.getByText('Transactions')
    userEvent.click(transactionsTab)

    await waitFor(() => expect(screen.getByText('Tx')).toBeInTheDocument())
  })
})
