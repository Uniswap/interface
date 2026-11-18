import { PdpDepositPanel } from '~/pages/PoolDetails/components/LiquidityPanel/PdpDepositPanel'
import { render, screen } from '~/test-utils/render'

describe('PdpDepositPanel', () => {
  it('renders the fallback outside the deposit flow instead of throwing', () => {
    render(<PdpDepositPanel fallback={<span>pool stats</span>} />)

    expect(screen.getByText('pool stats')).toBeInTheDocument()
  })
})
