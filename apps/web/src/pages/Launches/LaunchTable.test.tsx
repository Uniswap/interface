import { LaunchesOrderBy } from '@uniswap/client-launches/dist/launches/v1/types_pb'
import { LaunchTable } from '~/pages/Launches/LaunchTable'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

// Literals on purpose: reviewed copy, not values to re-derive from the locale file.
const FDV_TOOLTIP =
  'Fully diluted valuation (FDV) calculates the total market value assuming all tokens are in circulation.'
const VOLUME_TOOLTIP =
  '1 day volume is the amount of the asset that has been traded on Uniswap during the past 24 hours.'
const LIQUIDITY_TOOLTIP = 'Liquidity is the total value of this token held across its Uniswap pools.'
const LAUNCHPAD_TOOLTIP =
  'Launchpads are platforms that launch new tokens into Uniswap pools. These are listed based on ≥1% launch-volume share on their respective chains. Inclusion is not itself an endorsement of any launchpad.'

function renderTable(onSort = vi.fn()): void {
  render(
    <LaunchTable
      launches={[]}
      loading={false}
      hasNextPage={false}
      onLoadMore={() => Promise.resolve()}
      sortBy={LaunchesOrderBy.VOLUME_1D}
      ascending={false}
      onSort={onSort}
    />,
  )
}

describe('LaunchTable headers', () => {
  it('explains what launchpads are on the Launchpad header', async () => {
    renderTable()

    fireEvent.mouseEnter(screen.getByText('Launchpad'))

    await waitFor(() => expect(screen.getByText(LAUNCHPAD_TOOLTIP)).toBeInTheDocument())
  })

  it.each([
    ['FDV', FDV_TOOLTIP],
    ['24H volume', VOLUME_TOOLTIP],
    ['Liquidity', LIQUIDITY_TOOLTIP],
  ])('explains the %s column on its header', async (header, tooltip) => {
    renderTable()

    fireEvent.mouseEnter(screen.getByText(header))

    await waitFor(() => expect(screen.getByText(tooltip)).toBeInTheDocument())
  })

  it('sorts from the 24H volume header but not from its tooltip', async () => {
    const onSort = vi.fn()
    renderTable(onSort)

    const header = screen.getByText('24H volume')
    fireEvent.mouseEnter(header)
    const tooltip = await screen.findByText(VOLUME_TOOLTIP)

    fireEvent.click(tooltip)
    expect(onSort).not.toHaveBeenCalled()

    fireEvent.click(header)
    expect(onSort).toHaveBeenCalledWith(LaunchesOrderBy.VOLUME_1D)
  })
})
