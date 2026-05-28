import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      if (key === 'dataApi.outage.banner.title') {
        return 'Cannot load latest token prices'
      }
      return key
    },
  }),
}))

describe(DataApiOutageBanner, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the banner content', () => {
    render(<DataApiOutageBanner />)
    expect(screen.getByText('Cannot load latest token prices')).toBeTruthy()
  })

  it('calls onPress when banner is tapped', () => {
    const onPress = vi.fn()
    render(<DataApiOutageBanner onPress={onPress} />)

    fireEvent.press(screen.getByText('Cannot load latest token prices'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('banner is not pressable when no onPress', () => {
    render(<DataApiOutageBanner />)
    fireEvent.press(screen.getByText('Cannot load latest token prices'))
    expect(screen.getByText('Cannot load latest token prices')).toBeTruthy()
  })
})
