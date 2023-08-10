import { useV3Positions } from 'hooks/useV3Positions'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import CTACards from './CTACards'

jest.mock('hooks/useV3Positions')

describe('CTAcard links', () => {
  it('renders mainnet link when chain is not supported', () => {
    mocked(useV3Positions).mockReturnValue({ loading: false, positions: undefined })

    render(<CTACards />)
    expect(screen.getByTestId('cta-infolink')).toHaveAttribute('href', 'https://info.uniswap.org/#/pools')
  })
})
