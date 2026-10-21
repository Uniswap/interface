import { screen, waitFor } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { MarginFormStoreContextProvider } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContextProvider'
import { MarginTerminalLayout } from '~/pages/Swap/Margin/MarginTerminalLayout'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

// A vi.mock factory runs the first time its module is import()-ed, so these counters measure exactly
// what the bundle claim is about: did the margin chunks get fetched at all? One counter per lazy
// boundary this layout owns — a single counter would let a second door open unnoticed, which is how
// the completion listener once arrived as a static import.
const { modalLoads, listenerLoads } = vi.hoisted(() => ({
  modalLoads: { count: 0 },
  listenerLoads: { count: 0 },
}))

vi.mock('~/pages/Swap/Margin/MarginPlanReviewModal', () => {
  modalLoads.count += 1
  return { MarginPlanReviewModal: () => null }
})

vi.mock('~/pages/Swap/Margin/hooks/useMarginCompletionToast', () => {
  listenerLoads.count += 1
  return { useMarginCompletionToast: () => undefined }
})

// The provider the app hoists above UniversalSwapFlow, which is what actually renders this layout —
// the flag-on subtree reads the margin form store, so rendering the layout bare would throw.
function renderLayout(): void {
  render(
    <MarginFormStoreContextProvider>
      <MarginTerminalLayout isTerminal={false} hasInteracted={false}>
        <div data-testid="swap-module" />
      </MarginTerminalLayout>
    </MarginFormStoreContextProvider>,
  )
}

// The counter is cumulative on purpose: it is never reset, so reordering these two cases makes
// the flag-off case fail rather than silently pass off a warm module cache.
describe('margin bundle gating', () => {
  it('never fetches any margin chunk while the margin flag is off', async () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    renderLayout()

    expect(await screen.findByTestId('swap-module')).toBeInTheDocument()
    expect(modalLoads.count).toBe(0)
    expect(listenerLoads.count).toBe(0)
  })

  it('fetches both margin chunks once the margin flag is on', async () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.Margin)

    renderLayout()

    await waitFor(() => expect(modalLoads.count).toBe(1))
    await waitFor(() => expect(listenerLoads.count).toBe(1))
  })
})
