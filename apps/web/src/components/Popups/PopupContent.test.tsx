import '~/test-utils/tokens/mocks'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'
import { ActivityPopupContent } from '~/components/Popups/PopupContent'
import { render, screen } from '~/test-utils/render'

function createActivity(activity: Partial<Activity>): Activity {
  return {
    id: activity.id ?? 'activity-id',
    chainId: activity.chainId ?? DAI.chainId,
    status: activity.status ?? TransactionStatus.Pending,
    timestamp: activity.timestamp ?? Date.now(),
    title: activity.title ?? 'Swapping',
    descriptor: activity.descriptor ?? '1 ETH for 2,700 DAI',
    currencies: activity.currencies ?? [DAI, USDC_MAINNET],
    from: activity.from ?? '0xpreview',
    ...activity,
  }
}

describe('ActivityPopupContent', () => {
  it('renders the pending ring instead of the close icon for pending activity', () => {
    render(<ActivityPopupContent activity={createActivity({ status: TransactionStatus.Pending })} onClose={vi.fn()} />)

    expect(screen.getByTestId(TestID.ActivityPopup)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.ActivityPopupPendingRing)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.ActivityPopupCloseIcon)).not.toBeInTheDocument()
  })

  it('renders the close icon and hides the pending ring for completed activity', () => {
    render(
      <ActivityPopupContent
        activity={createActivity({ status: TransactionStatus.Success, title: 'Swapped' })}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByTestId(TestID.ActivityPopupCloseIcon)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.ActivityPopupPendingRing)).not.toBeInTheDocument()
  })

  it('keeps the completed thumbnail free of the pending ring when the finalized toast rerenders', () => {
    const { rerender } = render(
      <ActivityPopupContent
        activity={createActivity({ status: TransactionStatus.Success, title: 'Swapped' })}
        onClose={vi.fn()}
      />,
    )

    rerender(
      <ActivityPopupContent
        activity={createActivity({
          status: TransactionStatus.Success,
          title: 'Swapped',
          descriptor: 'Updated descriptor',
        })}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByTestId(TestID.ActivityPopupCloseIcon)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.ActivityPopupPendingRing)).not.toBeInTheDocument()
  })
})
