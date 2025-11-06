import { NewUserCTAButton } from 'components/NavBar/DownloadApp/NewUserCTAButton'
import { render, screen } from 'test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
})

describe('NewUserCTAButton', () => {
  it('displays a button with call to action text and icons', () => {
    const { container } = render(<NewUserCTAButton />)

    expect(container).toMatchSnapshot()
    expect(screen.getByText('Get the app')).toBeVisible()
  })
})
