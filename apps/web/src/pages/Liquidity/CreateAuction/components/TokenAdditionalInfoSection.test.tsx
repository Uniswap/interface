import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TokenAdditionalInfoSection } from '~/pages/Liquidity/CreateAuction/components/TokenAdditionalInfoSection'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddress: () => undefined,
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useXOAuthFlow', () => ({
  useXOAuthFlow: () => ({ connectX: vi.fn(), isLoading: false, error: null }),
}))

// Literal copy on purpose: deriving it from the i18n source would let a dropped key pass.
const X_PROFILE_HELP =
  'Connecting proves this X account belongs to the token’s creator. It’s shown on your auction page — you can skip it.'

function renderSection() {
  const store = createCreateAuctionStore()
  return render(
    <CreateAuctionStoreContext.Provider value={store}>
      <TokenAdditionalInfoSection description="" onDescriptionChange={() => {}} />
    </CreateAuctionStoreContext.Provider>,
  )
}

function getHelpTrigger(container: HTMLElement): Element {
  const trigger = container.querySelector('[data-slot="tooltip-compat-trigger"]')
  if (!trigger) {
    throw new Error('X Profile help trigger did not render')
  }
  return trigger
}

describe('TokenAdditionalInfoSection X Profile help', () => {
  it('labels the (?) icon with the X Profile explanation', () => {
    renderSection()

    expect(screen.getByLabelText(X_PROFILE_HELP)).toBeInTheDocument()
  })

  it('keeps the explanation hidden until the (?) icon is engaged', () => {
    renderSection()

    expect(screen.queryByText(X_PROFILE_HELP)).toBeNull()
  })

  it('reaches the (?) icon by keyboard and shows the explanation', async () => {
    const user = userEvent.setup()
    const { container } = renderSection()

    // The description field is the only tab stop ahead of the (?) icon.
    await user.click(screen.getByRole('textbox'))
    await user.tab()

    expect(getHelpTrigger(container)).toHaveFocus()
    expect(await screen.findByText(X_PROFILE_HELP)).toBeInTheDocument()
  })
})
