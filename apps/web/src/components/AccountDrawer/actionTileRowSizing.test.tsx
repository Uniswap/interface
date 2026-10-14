import { TestID } from '@universe/test'
import { AuthenticatedHeader } from '~/components/AccountDrawer/AuthenticatedHeader'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { renderWithUniswapContext, screen } from '~/test-utils/render'

// The tiles only render on a non-empty portfolio; everything else the header needs comes from
// the shared test providers.
vi.mock('~/pages/Portfolio/Overview/hooks/useIsPortfolioZero', () => ({
  useIsPortfolioZero: () => false,
}))

const TEST_ADDRESS = '0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb'

function tileWrapper(testId: string): Element {
  const wrapper = screen.getByTestId(testId).parentElement?.parentElement
  expect(wrapper).not.toBeNull()
  return wrapper as Element
}

describe('Send/Receive action tile row sizing', () => {
  // `grow` alone leaves flex-basis auto, which sizes each tile by its label ("Receive" is wider
  // than "Send") instead of splitting the row evenly.
  it('gives both tiles a zero flex basis so they split the row evenly', () => {
    renderWithUniswapContext(<AuthenticatedHeader evmAddress={TEST_ADDRESS} openSettings={() => undefined} />)

    for (const testId of [TestID.Send, TestID.WalletReceiveCrypto]) {
      const wrapper = tileWrapper(testId)
      expect(getOwnStyleProp(wrapper, 'grow')).toBe(true)
      expect(getOwnStyleProp(wrapper, 'flexBasis')).toBe(0)
    }
  })
})
