import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { TableSectionHeader } from '~/pages/Portfolio/Overview/TableSectionHeader'
import { render, screen } from '~/test-utils/render'

describe('TableSectionHeader', () => {
  it('renders the title and subtitle without a total value by default', () => {
    render(<TableSectionHeader title="Tokens" subtitle="22 tokens" />)

    expect(screen.getByText('Tokens')).toBeInTheDocument()
    expect(screen.getByText('22 tokens')).toBeInTheDocument()
    expect(screen.queryByText('·')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.AnimatedNumber)).not.toBeInTheDocument()
  })

  it('renders the formatted total value next to the title when provided', () => {
    render(
      <TableSectionHeader
        title="Tokens"
        subtitle="22 tokens"
        totalValueFormatted="$8,783.76"
        totalValueNumeric={8783.76}
      />,
    )

    expect(screen.getByText('·')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.AnimatedNumber)).toBeInTheDocument()
  })

  it('shows the separator while the total value is loading', () => {
    render(<TableSectionHeader title="Pools" subtitle="4 open positions" totalValueLoading />)

    expect(screen.getByText('·')).toBeInTheDocument()
  })

  it('does not render the warning indicator without a warning message', () => {
    render(<TableSectionHeader title="Pools" subtitle="4 open positions" />)

    expect(screen.queryByTestId(TestID.PoolsUnavailableIndicator)).not.toBeInTheDocument()
  })

  it('renders the warning indicator when a warning message is provided', () => {
    render(
      <TableSectionHeader
        title="Pools"
        subtitle="4 open positions"
        warningMessage="Pools on X Layer currently unavailable"
      />,
    )

    expect(screen.getByTestId(TestID.PoolsUnavailableIndicator)).toBeInTheDocument()
  })
})
