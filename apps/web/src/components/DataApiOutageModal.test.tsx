import { DataApiOutageModal } from '~/components/DataApiOutageModal'
import { useModalState } from '~/hooks/useModalState'
import { DataApiOutageModalParams } from '~/state/application/reducer'
import { useAppSelector } from '~/state/hooks'
import { render, screen } from '~/test-utils/render'

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('~/state/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/hooks')>()),
  useAppSelector: vi.fn(),
}))

const mockFormat = vi.fn(() => 'Mar 9, 2024, 4:00 PM')
vi.mock('uniswap/src/features/language/localizedDayjs', () => ({
  useLocalizedDayjs: () => vi.fn(() => ({ format: mockFormat })),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'dataApi.outage.modal.title') {
        return 'Service provider offline'
      }
      if (key === 'dataApi.outage.modal.description') {
        return 'Token prices, balances, activity, and other data will automatically update when service is restored.'
      }
      if (key === 'dataApi.outage.modal.cachedData') {
        return `Last updated ${params?.['time']}`
      }
      if (key === 'common.button.close') {
        return 'Close'
      }
      return key
    },
  }),
}))

const mockOnClose = vi.fn()

function mockModalInitialState(initialState: DataApiOutageModalParams['initialState'] | undefined): void {
  vi.mocked(useAppSelector).mockImplementation(() => initialState)
}

describe('DataApiOutageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when modal is not open', () => {
    vi.mocked(useModalState).mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      onClose: mockOnClose,
      toggleModal: vi.fn(),
    })
    mockModalInitialState({ dataUpdatedAt: 1710000000000 })

    render(<DataApiOutageModal />)
    expect(screen.queryByText('Service provider offline')).toBeNull()
  })

  it('shows timestamp when dataUpdatedAt is available', () => {
    vi.mocked(useModalState).mockReturnValue({
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      onClose: mockOnClose,
      toggleModal: vi.fn(),
    })
    mockModalInitialState({ dataUpdatedAt: 1710000000000 })

    render(<DataApiOutageModal />)
    expect(screen.getByText('Last updated Mar 9, 2024, 4:00 PM')).toBeTruthy()
  })

  it('hides timestamp when dataUpdatedAt is undefined', () => {
    vi.mocked(useModalState).mockReturnValue({
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      onClose: mockOnClose,
      toggleModal: vi.fn(),
    })
    mockModalInitialState({ dataUpdatedAt: undefined })

    render(<DataApiOutageModal />)
    expect(screen.getByText('Service provider offline')).toBeTruthy()
    expect(screen.queryByText(/Last updated/)).toBeNull()
  })

  it('renders modal content when open with stale data', () => {
    vi.mocked(useModalState).mockReturnValue({
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      onClose: mockOnClose,
      toggleModal: vi.fn(),
    })
    mockModalInitialState({ dataUpdatedAt: undefined })

    render(<DataApiOutageModal />)
    expect(screen.getByText('Service provider offline')).toBeTruthy()
    expect(screen.getByText('Close')).toBeTruthy()
  })
})
