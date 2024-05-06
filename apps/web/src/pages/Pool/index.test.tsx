import { isSupportedChain } from 'constants/chains'
import { useV3Positions } from 'hooks/useV3Positions'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import Pool from '.'

jest.mock('constants/chains')
jest.mock('hooks/useV3Positions')

describe('networks', () => {
  it('renders error card when unsupported chain is selected', () => {
    mocked(isSupportedChain).mockReturnValue(false)
    mocked(useV3Positions).mockReturnValue({ loading: false, positions: undefined })

    render(<Pool />)
    expect(screen.getByText('Your connected network is unsupported.')).toBeInTheDocument()
  })

  it('renders empty positions card when on supported chain with no positions', () => {
    mocked(isSupportedChain).mockReturnValue(true)
    mocked(useV3Positions).mockReturnValue({ loading: false, positions: undefined })

    render(<Pool />)
    expect(screen.getByText('Your active V3 liquidity positions will appear here.')).toBeInTheDocument()
  })
})
