import { REFRESH_FRAME_HIDDEN_CLASS, REFRESH_FRAME_REVEAL_CLASSES } from '@universe/mycelium/refresh-button-compat'
import { TestID } from '@universe/test'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { render } from 'uniswap/src/test/test-utils'

/**
 * The refresh button is revealed only by hovering its ANCESTOR group — the
 * AnimatedNumber row that receives it as `EndElement`. Anchor and consumer must
 * therefore mark the group in the SAME system: a reveal keyed to one system
 * under an anchor that marks the other renders at opacity 0 forever while every
 * static gate stays green, which is exactly how the button went invisible but
 * still clickable.
 *
 * jsdom never matches `:hover` and the Tailwind stylesheet is not compiled into
 * this environment, so NO test here can observe the reveal actually happening —
 * in both systems it is pure CSS. What these tests can pin, and what the
 * regression broke, is the pairing: the frame carries the `group-hover:` reveal,
 * and the marker that reveal resolves against comes from a real ancestor.
 */

const refetch = vi.fn()

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalanceBreakdown: () => ({
    data: {
      [PortfolioBalancePart.Total]: { balanceUSD: 1234.56, percentChange: 1.2, absoluteChangeUSD: 10 },
    },
    requestedCategories: [],
    loading: false,
    error: undefined,
    refetch,
  }),
}))

function renderBalance(): { anchor: HTMLElement; frame: HTMLElement } {
  render(<PortfolioBalance evmOwner="0x0000000000000000000000000000000000000001" />)
  const anchor = document.querySelector(`[data-testid="${TestID.AnimatedNumber}"]`)
  if (!(anchor instanceof HTMLElement)) {
    throw new Error('AnimatedNumber group anchor not rendered')
  }
  const frame = anchor.querySelector('[role="button"]')
  if (!(frame instanceof HTMLElement)) {
    throw new Error('refresh button frame not rendered inside the anchor')
  }
  return { anchor, frame }
}

describe('PortfolioBalance refresh button hover reveal', () => {
  it('rests hidden and carries the group-hover reveal classes', () => {
    const { frame } = renderBalance()

    expect(frame.classList.contains('opacity-0')).toBe(true)
    expect(frame.classList.contains(REFRESH_FRAME_HIDDEN_CLASS)).toBe(false)
    for (const cls of REFRESH_FRAME_REVEAL_CLASSES.split(' ')) {
      expect(frame.classList.contains(cls)).toBe(true)
    }
  })

  it('takes its group marker from the anchor, not from itself', () => {
    const { anchor, frame } = renderBalance()

    // `group-hover:` resolves against a HOVERED ANCESTOR `.group`. The frame is
    // its own group anchor too, so the marker must come from a strict ancestor —
    // `closest` from the frame itself would match the frame and prove nothing.
    expect(frame.parentElement?.closest('.group')).toBe(anchor)
  })

  it('renders no legacy Tamagui group marker for the reveal to depend on', () => {
    const { anchor, frame } = renderBalance()

    expect(frame.className).not.toMatch(/(^|\s)t_group/)
    expect(frame.className).not.toMatch(/_opacity-_group/)
    expect(anchor.className).not.toMatch(/(^|\s)t_group/)
  })
})
