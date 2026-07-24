import { DepositReviewDetails } from 'uniswap/src/features/earn/DepositReviewDetails'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { render, screen } from 'uniswap/src/test/test-utils'

const vault = {
  chainId: 1,
  vaultAddress: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
  apyPercent: 3.59,
} as EarnVaultInfo

function renderDetails(expanded: boolean): ReturnType<typeof render> {
  return render(
    <DepositReviewDetails
      balanceAfterUsd={43.56}
      currentBalanceUsd={41.56}
      expanded={expanded}
      formatLocalFiat={(value) => `$${value.toFixed(2)}`}
      formatPercent={(value) => `${value}%`}
      networkCostLabel="$0.08"
      projectedAnnualEarningsUsd={0.07}
      vault={vault}
      onToggleExpanded={vi.fn()}
    />,
  )
}

describe(DepositReviewDetails, () => {
  it('shows expanded-only rows without hiding the persistent review controls', () => {
    renderDetails(true)

    expect(screen.getByText('explore.earn.deposit.vault')).toBeDefined()
    expect(screen.getByText('explore.earn.deposit.yourBalance')).toBeDefined()
    expect(screen.getByText('explore.earn.deposit.showLess')).toBeDefined()
    expect(screen.getByText('explore.earn.deposit.rate')).toBeDefined()
    expect(screen.getByText('explore.earn.deposit.projectedEarnings')).toBeDefined()
    expect(screen.getByText('common.networkCost')).toBeDefined()
  })

  it('omits expanded-only rows when collapsed', () => {
    renderDetails(false)

    expect(screen.queryByText('explore.earn.deposit.vault')).toBeNull()
    expect(screen.queryByText('explore.earn.deposit.yourBalance')).toBeNull()
    expect(screen.getByText('explore.earn.deposit.showMore')).toBeDefined()
  })
})
