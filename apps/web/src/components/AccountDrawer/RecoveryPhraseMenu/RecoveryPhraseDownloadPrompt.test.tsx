import { fireEvent } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { RecoveryPhraseDownloadPrompt } from '~/components/AccountDrawer/RecoveryPhraseMenu/RecoveryPhraseDownloadPrompt'
import { render, screen } from '~/test-utils/render'
import { openDownloadApp } from '~/utils/openDownloadApp'

const env = vi.hoisted(() => ({ isMobileWeb: false }))
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileWeb() {
      return env.isMobileWeb
    },
  }
})

vi.mock('~/utils/openDownloadApp', () => ({
  openDownloadApp: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/SlideOutMenu', () => ({
  SlideOutMenu: ({ children, title }: PropsWithChildren<{ title: ReactNode }>) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
}))

describe('RecoveryPhraseDownloadPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.isMobileWeb = false
  })

  describe('mobile web', () => {
    beforeEach(() => {
      env.isMobileWeb = true
    })

    it('opens the OS-appropriate app store from the "Get Uniswap Mobile" button', () => {
      render(<RecoveryPhraseDownloadPrompt onBack={vi.fn()} onContinueOnWeb={vi.fn()} />)
      fireEvent.click(screen.getByText('Get Uniswap Mobile'))
      expect(openDownloadApp).toHaveBeenCalledOnce()
    })

    it('does not render the desktop mobile-app or browser-extension cards', () => {
      render(<RecoveryPhraseDownloadPrompt onBack={vi.fn()} onContinueOnWeb={vi.fn()} />)
      expect(screen.queryByText('Mobile app')).not.toBeInTheDocument()
      expect(screen.queryByText('Browser extension')).not.toBeInTheDocument()
    })

    it('fires onContinueOnWeb from the "Continue on web" button', () => {
      const onContinueOnWeb = vi.fn()
      render(<RecoveryPhraseDownloadPrompt onBack={vi.fn()} onContinueOnWeb={onContinueOnWeb} />)
      fireEvent.click(screen.getByText('Continue on web'))
      expect(onContinueOnWeb).toHaveBeenCalledOnce()
    })
  })

  describe('desktop web', () => {
    it('renders the mobile-app and browser-extension download cards', () => {
      render(<RecoveryPhraseDownloadPrompt onBack={vi.fn()} onContinueOnWeb={vi.fn()} />)
      expect(screen.getByText('Mobile app')).toBeInTheDocument()
      expect(screen.getByText('Browser extension')).toBeInTheDocument()
    })

    it('does not render the "Get Uniswap Mobile" button or call openDownloadApp', () => {
      render(<RecoveryPhraseDownloadPrompt onBack={vi.fn()} onContinueOnWeb={vi.fn()} />)
      expect(screen.queryByText('Get Uniswap Mobile')).not.toBeInTheDocument()
      expect(openDownloadApp).not.toHaveBeenCalled()
    })
  })
})
