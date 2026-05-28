import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

const mockFormat = vi.fn(() => 'Mar 9, 2024, 4:00 PM')
const mockDayjs = vi.fn(() => ({ format: mockFormat }))

vi.mock('uniswap/src/features/language/localizedDayjs', () => ({
  useLocalizedDayjs: (): typeof mockDayjs => mockDayjs,
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, params?: Record<string, string>) => string } => ({
    t: (key: string, params?: Record<string, string>): string => {
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

describe('DataApiOutageModalContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with formatted time when lastUpdatedAt is provided', () => {
    render(<DataApiOutageModalContent isOpen={true} lastUpdatedAt={1710000000000} onClose={vi.fn()} />)
    expect(screen.getByText('Last updated Mar 9, 2024, 4:00 PM')).toBeTruthy()
    expect(mockDayjs).toHaveBeenCalledWith(1710000000000)
  })

  it('hides time when lastUpdatedAt is undefined', () => {
    render(<DataApiOutageModalContent isOpen={true} lastUpdatedAt={undefined} onClose={vi.fn()} />)
    expect(screen.getByText('Service provider offline')).toBeTruthy()
    expect(screen.queryByText(/Last updated/)).toBeNull()
  })

  it('calls onClose on button press', () => {
    const onClose = vi.fn()
    render(<DataApiOutageModalContent isOpen={true} lastUpdatedAt={undefined} onClose={onClose} />)
    fireEvent.press(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
