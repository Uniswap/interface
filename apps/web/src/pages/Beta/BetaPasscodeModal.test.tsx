import { getOverrideAdapter } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { BetaPasscodeModal } from '~/pages/Beta/BetaPasscodeModal'
import { act, fireEvent, render, screen } from '~/test-utils/render'

vi.mock('ui/src/assets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src/assets')>()
  return {
    ...actual,
    BETA_LOGO: 'beta-logo-mock',
  }
})

const mockGetDynamicConfigValue = vi.fn().mockReturnValue([])
vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    getDynamicConfigValue: (...args: unknown[]) => mockGetDynamicConfigValue(...args),
    getOverrideAdapter: vi.fn().mockReturnValue({ overrideGate: vi.fn() }),
  }
})

const mockLocationReplace = vi.fn()

describe('BetaPasscodeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDynamicConfigValue.mockReturnValue([])
    Object.defineProperty(window, 'location', {
      value: { ...window.location, replace: mockLocationReplace },
      configurable: true,
      writable: true,
    })
  })

  it('renders default state', () => {
    const { container } = render(<BetaPasscodeModal />)
    expect(screen.getByText('Uniswap Preview')).toBeTruthy()
    expect(screen.getByTestId(TestID.PreviewPassphraseInput)).toBeTruthy()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('submit button is disabled when input is empty', () => {
    render(<BetaPasscodeModal />)
    const submitButton = screen.getByTestId(TestID.PreviewPassphraseSubmit)
    expect(submitButton).toBeDisabled()
  })

  it('shows error on incorrect passphrase', async () => {
    render(<BetaPasscodeModal />)
    const input = screen.getByTestId(TestID.PreviewPassphraseInput)
    const submitButton = screen.getByTestId(TestID.PreviewPassphraseSubmit)

    await act(async () => {
      fireEvent.change(input, { target: { value: 'wrong-passphrase' } })
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(screen.getByTestId(TestID.PreviewPassphraseError)).toBeTruthy()
  })

  it('overrides gate and navigates on correct passphrase', async () => {
    mockGetDynamicConfigValue.mockReturnValue(['correct-code'])
    render(<BetaPasscodeModal />)
    const input = screen.getByTestId(TestID.PreviewPassphraseInput)
    const submitButton = screen.getByTestId(TestID.PreviewPassphraseSubmit)

    await act(async () => {
      fireEvent.change(input, { target: { value: 'correct-code' } })
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(getOverrideAdapter().overrideGate).toHaveBeenCalledWith('embedded_wallet', true)
    expect(mockLocationReplace).toHaveBeenCalledWith('/?intro=true')
  })
})
