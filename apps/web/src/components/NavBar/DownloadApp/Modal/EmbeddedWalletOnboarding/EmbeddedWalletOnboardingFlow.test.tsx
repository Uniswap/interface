import { fireEvent, waitFor } from '@testing-library/react'
import { useCanClaimUnitagName } from 'uniswap/src/features/unitags/hooks/useCanClaimUnitagName'
import { useSuggestedUnitag } from 'uniswap/src/features/unitags/suggestions/useSuggestedUnitag'
import type { Mock } from 'vitest'
import { EmbeddedWalletOnboardingFlow } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/EmbeddedWalletOnboardingFlow'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/unitags/suggestions/useSuggestedUnitag', () => ({
  useSuggestedUnitag: vi.fn(),
}))

vi.mock('uniswap/src/features/unitags/hooks/useCanClaimUnitagName', () => ({
  useCanClaimUnitagName: vi.fn(),
}))

vi.mock('~/hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockSignInWithPasskey = vi.fn()
const mockShuffle = vi.fn()

describe('EmbeddedWalletOnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSuggestedUnitag as Mock).mockReturnValue({
      suggestion: 'swiftriver',
      isInitializing: false,
      isShuffling: false,
      shuffle: mockShuffle,
    })
    ;(useCanClaimUnitagName as Mock).mockReturnValue({ error: undefined, loading: false })
    ;(useSignInWithPasskey as Mock).mockReturnValue({ signInWithPasskey: mockSignInWithPasskey, isPending: false })
  })

  // Advances from the welcome screen to the combined create screen and waits for it to mount.
  async function advanceToCreateScreen(): Promise<void> {
    fireEvent.click(screen.getByTestId('continue'))
    await waitFor(() => expect(screen.getByTestId('wallet-name-input')).toBeTruthy())
  }

  it('renders the welcome screen first', () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    expect(screen.getByText('embeddedWallet.onboarding.welcome.title')).toBeTruthy()
  })

  it('prefills the create screen with the suggested unitag', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    // The prefill crossfades in, so the rendered value lags the state by the fade duration.
    await waitFor(() => expect((screen.getByTestId('wallet-name-input') as HTMLInputElement).value).toBe('swiftriver'))
  })

  it('requests a new suggestion when shuffle is pressed', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    fireEvent.click(screen.getByTestId('shuffle-unitag'))
    expect(mockShuffle).toHaveBeenCalled()
  })

  it('creates the wallet with the selected unitag', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    // The availability check is debounced, so the CTA enables once it settles.
    const createButton = screen.getByTestId('create-passkey') as HTMLButtonElement
    await waitFor(() => expect(createButton.disabled).toBe(false), { timeout: 2000 })
    fireEvent.click(createButton)
    expect(mockSignInWithPasskey).toHaveBeenCalled()
  })

  // The unitagSource passed to the latest useSignInWithPasskey call (re-invoked on every render).
  function latestUnitagSource(): string | undefined {
    const calls = (useSignInWithPasskey as Mock).mock.calls
    return calls.at(-1)?.[0]?.unitagSource
  }

  it('attributes the prefilled source when the suggestion is used as-is', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    expect(latestUnitagSource()).toBe('prefilled')
  })

  it('attributes the shuffled source after shuffling', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    fireEvent.click(screen.getByTestId('shuffle-unitag'))
    await waitFor(() => expect(latestUnitagSource()).toBe('shuffled'))
  })

  it('attributes the edited source after the user types', async () => {
    render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    fireEvent.change(screen.getByTestId('wallet-name-input'), { target: { value: 'customname' } })
    await waitFor(() => expect(latestUnitagSource()).toBe('edited'))
  })

  it('keeps typed input when a late suggestion arrives after the user edits', async () => {
    ;(useSuggestedUnitag as Mock).mockReturnValue({
      suggestion: undefined,
      isInitializing: true,
      isShuffling: false,
      shuffle: mockShuffle,
    })
    const { rerender } = render(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)
    await advanceToCreateScreen()
    fireEvent.change(screen.getByTestId('wallet-name-input'), { target: { value: 'customname' } })

    ;(useSuggestedUnitag as Mock).mockReturnValue({
      suggestion: 'swiftriver',
      isInitializing: false,
      isShuffling: false,
      shuffle: mockShuffle,
    })
    rerender(<EmbeddedWalletOnboardingFlow onClose={vi.fn()} />)

    expect((screen.getByTestId('wallet-name-input') as HTMLInputElement).value).toBe('customname')
    expect(latestUnitagSource()).toBe('edited')
  })
})
