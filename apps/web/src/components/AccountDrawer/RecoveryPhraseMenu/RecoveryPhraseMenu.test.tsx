import { act, fireEvent, waitFor } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { exportSeedPhrase } from 'uniswap/src/features/passkey/utils'
import { invalidateListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { PhraseDisplayContent } from '~/components/AccountDrawer/RecoveryPhraseMenu/PhraseDisplayContent'
import { RecoveryPhraseMenu } from '~/components/AccountDrawer/RecoveryPhraseMenu/RecoveryPhraseMenu'
import { WarningContent } from '~/components/AccountDrawer/RecoveryPhraseMenu/WarningContent'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/passkey/utils', () => ({
  exportSeedPhrase: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/PasskeyMenu/PasskeyMenu', () => ({
  invalidateListAuthenticators: vi.fn(),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/embeddedWallet/store')>()),
  useEmbeddedWalletState: vi.fn(),
}))

const mockCopy = vi.fn()
vi.mock('~/hooks/useCopyClipboard', () => ({
  useCopyClipboard: vi.fn(() => [false, mockCopy]),
}))

vi.mock('~/components/AccountDrawer/SlideOutMenu', () => ({
  SlideOutMenu: ({ children, title }: PropsWithChildren<{ title: ReactNode }>) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
}))

const MOCK_PHRASE = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
const MOCK_PHRASE_24 =
  'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual'

describe('WarningContent', () => {
  it('fires onContinue when the CTA is pressed', () => {
    const onContinue = vi.fn()
    render(<WarningContent onContinue={onContinue} isLoading={false} />)
    fireEvent.click(screen.getByText('View recovery phrase'))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('renders the "View recovery phrase" button in loading state', () => {
    render(<WarningContent onContinue={vi.fn()} isLoading />)
    // Tamagui button doesn't expose a native disabled attr in loading state,
    // but the button still renders the label.
    expect(screen.getByText('View recovery phrase')).toBeInTheDocument()
  })
})

describe('PhraseDisplayContent', () => {
  const defaultProps = {
    seedPhrase: MOCK_PHRASE,
    isVisible: false,
    isCopied: false,
    onToggleVisibility: vi.fn(),
    onCopy: vi.fn(),
    onDone: vi.fn(),
  }

  it('hides words when isVisible is false', () => {
    render(<PhraseDisplayContent {...defaultProps} />)
    expect(screen.queryByText('abandon')).not.toBeInTheDocument()
  })

  it('shows words when isVisible is true and a phrase is present', () => {
    render(<PhraseDisplayContent {...defaultProps} isVisible />)
    expect(screen.getByText('abandon')).toBeInTheDocument()
    expect(screen.getByText('accident')).toBeInTheDocument()
  })

  it('fires onToggleVisibility when Show is pressed', () => {
    const onToggleVisibility = vi.fn()
    render(<PhraseDisplayContent {...defaultProps} onToggleVisibility={onToggleVisibility} />)
    fireEvent.click(screen.getByText('Show'))
    expect(onToggleVisibility).toHaveBeenCalledOnce()
  })

  it('fires onCopy when Copy is pressed', () => {
    const onCopy = vi.fn()
    render(<PhraseDisplayContent {...defaultProps} onCopy={onCopy} />)
    fireEvent.click(screen.getByText('Copy'))
    expect(onCopy).toHaveBeenCalledOnce()
  })

  it('fires onDone when Done is pressed', () => {
    const onDone = vi.fn()
    render(<PhraseDisplayContent {...defaultProps} onDone={onDone} />)
    fireEvent.click(screen.getByText('Done'))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('shows Copied label when isCopied is true', () => {
    render(<PhraseDisplayContent {...defaultProps} isCopied />)
    expect(screen.getByText('Copied')).toBeInTheDocument()
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('renders all 24 words from a 24-word EW seed phrase when visible', () => {
    render(<PhraseDisplayContent {...defaultProps} seedPhrase={MOCK_PHRASE_24} isVisible />)
    expect(screen.getByText('abandon')).toBeInTheDocument()
    expect(screen.getByText('actual')).toBeInTheDocument()
  })
})

describe('RecoveryPhraseMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEmbeddedWalletState).mockReturnValue({
      walletId: 'test-wallet-id',
    } as ReturnType<typeof useEmbeddedWalletState>)
  })

  it('starts on the warning step', () => {
    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    expect(screen.getByText('View recovery phrase')).toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })

  it('transitions to the display step after exportSeedPhrase resolves with a phrase', async () => {
    vi.mocked(exportSeedPhrase).mockResolvedValue(MOCK_PHRASE)

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('View recovery phrase'))

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
    expect(vi.mocked(exportSeedPhrase)).toHaveBeenCalledWith({ walletId: 'test-wallet-id' })
  })

  it('invalidates the listAuthenticators cache on a successful export so the speedbump shows the new timestamp', async () => {
    vi.mocked(exportSeedPhrase).mockResolvedValue(MOCK_PHRASE)

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('View recovery phrase'))

    await waitFor(() => {
      expect(invalidateListAuthenticators).toHaveBeenCalledWith(expect.anything(), 'test-wallet-id')
    })
  })

  it('does not invalidate the listAuthenticators cache when the user aborts the export', async () => {
    vi.mocked(exportSeedPhrase).mockResolvedValue(undefined)

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('View recovery phrase'))
    })

    expect(invalidateListAuthenticators).not.toHaveBeenCalled()
  })

  it('stays on the warning step when exportSeedPhrase returns undefined (user aborted)', async () => {
    vi.mocked(exportSeedPhrase).mockResolvedValue(undefined)

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('View recovery phrase'))
    })

    expect(screen.getByText('View recovery phrase')).toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })

  it('stays on the warning step when exportSeedPhrase throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(exportSeedPhrase).mockRejectedValue(new Error('boom'))

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('View recovery phrase'))
    })

    expect(screen.getByText('View recovery phrase')).toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })

  it('calls onClose from Done', async () => {
    const onClose = vi.fn()
    vi.mocked(exportSeedPhrase).mockResolvedValue(MOCK_PHRASE)

    render(<RecoveryPhraseMenu onClose={onClose} />)
    fireEvent.click(screen.getByText('View recovery phrase'))

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Done'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('reverts to the warning step after the 60s auto-hide fires (not stranded on display)', async () => {
    vi.useFakeTimers()
    vi.mocked(exportSeedPhrase).mockResolvedValue(MOCK_PHRASE)

    render(<RecoveryPhraseMenu onClose={vi.fn()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('View recovery phrase'))
    })

    // Now on display step. Reveal triggers the timer.
    await act(async () => {
      fireEvent.click(screen.getByText('Show'))
    })

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('View recovery phrase')).toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
