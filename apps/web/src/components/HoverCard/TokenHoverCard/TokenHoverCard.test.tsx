import { useIsTouchDevice } from '@universe/mycelium'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { TokenHoverCard } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { TEST_TOKEN_1, TEST_TOKEN_1_INFO } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: vi.fn(),
}))

// React reads this global to decide whether updates are expected inside act().
const reactTestGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }

// The mounted card parses currencyId (market stats), which the shared fixture's placeholder 'ABC' fails.
const currencyInfo = { ...TEST_TOKEN_1_INFO, currencyId: currencyId(TEST_TOKEN_1) }

describe('TokenHoverCard', () => {
  beforeEach(() => {
    mocked(useIsTouchDevice).mockReturnValue(false)
  })

  it('arms within the pointer-enter event, so a press on the row never straddles the remount', () => {
    const { container } = render(
      <TokenHoverCard currencyInfo={currencyInfo}>
        <button type="button">row</button>
      </TokenHoverCard>,
    )
    const armedTrigger = (): Element | null => container.querySelector('[role="none"][tabindex="-1"]')
    expect(armedTrigger()).toBeNull()

    // Outside act() so React schedules the update the way a browser does: only a commit made during the
    // event itself is visible to the synchronous assertions below. A later one can land between a press's
    // mousedown and mouseup, which detaches the mousedown target and makes the browser drop the click.
    const previousActEnvironment = reactTestGlobals.IS_REACT_ACT_ENVIRONMENT
    reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = false
    try {
      screen.getByRole('button', { name: 'row' }).dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(armedTrigger()).not.toBeNull()
    } finally {
      reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
    }
    expect(screen.getByRole('button', { name: 'row' })).toBeInTheDocument()
  })
})
