import { NewUserCTAButton } from 'components/NavBar/DownloadApp/NewUserCTAButton'
import { render, screen } from 'test-utils/render'

jest.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: jest.fn(),
}))

beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }))
})

describe('NewUserCTAButton', () => {
  it('displays a button with call to action text and icons', () => {
    const { container } = render(<NewUserCTAButton />)

    expect(container).toMatchSnapshot()
    expect(screen.getByText('Get the app')).toBeVisible()
  })
})
