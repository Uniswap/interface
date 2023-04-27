import * as useV3Positions from 'hooks/useV3Positions'
import { render, screen } from 'test-utils/render'

import CTACards from './CTACards'

describe('CTAcard links', () => {
  it('renders mainnet link when chain is not supported', () => {
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    render(<CTACards />)
    expect(screen.getByTestId('cta-infolink')).toHaveAttribute('href', 'https://info.uniswap.org/#/pools')
  })
})
