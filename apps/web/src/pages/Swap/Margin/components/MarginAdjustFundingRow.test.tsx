import { fireEvent, screen } from '@testing-library/react'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it, vi } from 'vitest'
import { MarginAdjustFundingRow } from '~/pages/Swap/Margin/components/MarginAdjustFundingRow'
import { render } from '~/test-utils/render'

// Its no-URL fallback renders the symbol as text, which would collide with the chip's own label.
vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({
  TokenLogo: () => null,
}))

const PAYMENT_TOKEN = {
  address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  symbol: 'UNI',
  decimals: 18,
  chainId: 1,
  isNative: false,
} as unknown as MarginPaymentToken

const BASE = {
  paymentToken: PAYMENT_TOKEN,
  depositAmountDisplay: '1.88',
  depositUsdCaption: '$7.26',
  hasSpendableBalance: true,
  withdrawAmountDisplay: '0.0081 ETH',
  onOpenSelector: vi.fn(),
  onFillMax: vi.fn(),
}

describe('MarginAdjustFundingRow', () => {
  describe('deposit', () => {
    const DEPOSIT = { kind: 'deposit', paymentAmountRaw: '1880000000000000000' } as const

    it('keeps the USD value, the max affordance and the cross-token conversion caption', () => {
      render(
        <MarginAdjustFundingRow {...BASE} funding={DEPOSIT} conversionCaption="via 1.88 UNI → ≈0.004 ETH margin" />,
      )
      expect(screen.getByText('Deposit required')).toBeInTheDocument()
      expect(screen.getByText('1.88 UNI')).toBeInTheDocument()
      expect(screen.getByText('$7.26')).toBeInTheDocument()
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('via 1.88 UNI → ≈0.004 ETH margin')).toBeInTheDocument()
    })

    it('drops the explainer that only restated the label', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={DEPOSIT} />)
      expect(screen.queryByText(/requires a deposit/i)).not.toBeInTheDocument()
    })

    it('omits the max affordance when the wallet balance is unknown', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={DEPOSIT} hasSpendableBalance={false} />)
      expect(screen.queryByText('Max')).not.toBeInTheDocument()
    })

    it('opens the payment-token selector from the chip', () => {
      const onOpenSelector = vi.fn()
      render(<MarginAdjustFundingRow {...BASE} funding={DEPOSIT} onOpenSelector={onOpenSelector} />)
      fireEvent.click(screen.getByLabelText('Pay with'))
      expect(onOpenSelector).toHaveBeenCalledOnce()
    })
  })

  describe('withdraw', () => {
    const WITHDRAW = { kind: 'withdraw', withdrawAmountRaw: '8100000000000000' } as const

    it('names what lands in the wallet, with no explainer', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={WITHDRAW} />)
      expect(screen.getByText('You’ll receive')).toBeInTheDocument()
      expect(screen.getByText('0.0081 ETH')).toBeInTheDocument()
      expect(screen.queryByText(/returns funds to your wallet/i)).not.toBeInTheDocument()
    })

    // Nothing is being paid, so there is no payment token to choose.
    it('offers no payment-token selector', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={WITHDRAW} />)
      expect(screen.queryByLabelText('Pay with')).not.toBeInTheDocument()
    })
  })

  describe('nothing moving', () => {
    const NONE = { kind: 'none' } as const

    it('still renders the row so the layout does not jump once an amount is typed', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={NONE} />)
      expect(screen.getByText('No deposit or withdrawal needed')).toBeInTheDocument()
    })

    // A selector offering to choose what to pay, when nothing is being paid, is noise. It returns with
    // the deposit row as soon as the margin is raised.
    it('offers no payment-token selector at all', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={NONE} />)
      expect(screen.queryByLabelText('Pay with')).not.toBeInTheDocument()
      expect(screen.queryByText('UNI')).not.toBeInTheDocument()
      expect(screen.queryByText(/\b0 UNI\b/)).not.toBeInTheDocument()
      expect(screen.queryByText('1.88 UNI')).not.toBeInTheDocument()
    })

    it('shows neither a USD value nor a max affordance', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={NONE} />)
      expect(screen.queryByText('$7.26')).not.toBeInTheDocument()
      expect(screen.queryByText('Max')).not.toBeInTheDocument()
    })

    it('suppresses a stale conversion caption', () => {
      render(<MarginAdjustFundingRow {...BASE} funding={NONE} conversionCaption="via 1.88 UNI → ≈0.004 ETH margin" />)
      expect(screen.queryByText(/via 1\.88 UNI/)).not.toBeInTheDocument()
    })
  })
})
