import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { VerifyIdentityModal } from '~/components/PermissionedPool/VerifyIdentityModal'
import { useModalState } from '~/hooks/useModalState'

const { mockOpenUri, mockCloseModal, mockOpenModal } = vi.hoisted(() => ({
  // Return a resolved promise so production's `openUri(...).catch(...)` chain works.
  mockOpenUri: vi.fn().mockResolvedValue(undefined),
  mockCloseModal: vi.fn(),
  mockOpenModal: vi.fn(),
}))

vi.mock('uniswap/src/utils/linking', () => ({
  openUri: mockOpenUri,
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({
    isOpen: true,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
    onClose: mockCloseModal,
    toggleModal: vi.fn(),
  })),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const parts: string[] = [key]
      if (opts?.tokenSymbol) {
        parts.push(String(opts.tokenSymbol))
      }
      if (opts?.provider) {
        parts.push(String(opts.provider))
      }
      return parts.join(':')
    },
  }),
}))

// Modal renders via a portal — ensure a portal target exists
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({
    children,
    isModalOpen,
  }: {
    children: React.ReactNode
    isModalOpen: boolean
    onClose: () => void
    name: string
    maxWidth?: number
    padding?: string
  }) => (isModalOpen ? <div data-testid="mock-modal">{children}</div> : null),
}))

function ThemeWrapper({ children }: PropsWithChildren) {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const renderWithTheme = (ui: React.ReactElement) => render(ui, { wrapper: ThemeWrapper })

const mockUseModalState = useModalState as ReturnType<typeof vi.fn>

const REGISTRATION_URL = 'https://superstate.com/register'

describe('VerifyIdentityModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseModalState.mockReturnValue({
      isOpen: true,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      onClose: mockCloseModal,
      toggleModal: vi.fn(),
    })
  })

  it('renders modal content when isOpen is true', () => {
    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="Superstate" />)

    expect(screen.getByTestId(TestID.VerifyIdentityModal)).toBeInTheDocument()
    expect(screen.getByText('permissionedPool.verifyIdentity.title')).toBeInTheDocument()
    expect(screen.getByText('permissionedPool.verifyIdentity.description:SLINK:Superstate')).toBeInTheDocument()
  })

  it('does NOT render when isOpen is false', () => {
    mockUseModalState.mockReturnValue({
      isOpen: false,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      onClose: mockCloseModal,
      toggleModal: vi.fn(),
    })

    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="Superstate" />)

    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).not.toBeInTheDocument()
  })

  it('calls openUri with the registration URL and closes the modal when the proceed button is clicked', () => {
    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="Superstate" />)

    fireEvent.click(screen.getByTestId(TestID.VerifyIdentityButton))
    expect(mockOpenUri).toHaveBeenCalledWith({
      uri: REGISTRATION_URL,
      openExternalBrowser: true,
    })
    expect(mockCloseModal).toHaveBeenCalledTimes(1)
  })

  it('renders the Learn more link', () => {
    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="Superstate" />)

    expect(screen.getByText('permissionedPool.verifyIdentity.learnMore')).toBeInTheDocument()
  })

  it('renders the legal disclaimer', () => {
    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="Superstate" />)

    expect(screen.getByText('permissionedPool.verifyIdentity.disclaimer:Superstate')).toBeInTheDocument()
  })

  // The missing-config path intentionally logs a BE-contract-violation warning; spy on
  // console.warn so jest-fail-on-console doesn't fail the test, and pin that it fired.
  const expectMissingConfigWarning = (): ReturnType<typeof vi.spyOn> =>
    vi.spyOn(console, 'warn').mockImplementation(() => {})

  it('renders the unavailable fallback (not blank provider copy) when issuer is empty', () => {
    const warnSpy = expectMissingConfigWarning()

    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer="" />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).not.toBeInTheDocument()
    // No provider-dependent copy should render with a blank provider.
    expect(screen.queryByText(/verifyIdentity\.disclaimer/)).not.toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('renders the unavailable fallback when issuer is undefined', () => {
    const warnSpy = expectMissingConfigWarning()

    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={REGISTRATION_URL} issuer={undefined} />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).not.toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('renders the unavailable fallback when registrationUrl is missing', () => {
    const warnSpy = expectMissingConfigWarning()

    renderWithTheme(<VerifyIdentityModal tokenSymbol="SLINK" registrationUrl={undefined} issuer="Superstate" />)

    expect(screen.getByTestId(TestID.VerifyIdentityUnavailableModal)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.VerifyIdentityModal)).not.toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
