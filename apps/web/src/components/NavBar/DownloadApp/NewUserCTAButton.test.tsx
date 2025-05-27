import { NewUserCTAButton } from 'components/NavBar/DownloadApp/NewUserCTAButton'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { AccountCTAsExperimentGroup } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupNameWithLoading } from 'uniswap/src/features/gating/hooks'

jest.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: jest.fn(),
}))

beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }))
  mocked(useExperimentGroupNameWithLoading).mockReturnValue({
    value: AccountCTAsExperimentGroup.Control,
    isLoading: false,
  })
})

describe('NewUserCTAButton', () => {
  it('displays a button with call to action text and icons', () => {
    const { container } = render(<NewUserCTAButton />)

    expect(container).toMatchSnapshot()
    expect(screen.getByText('Get the app')).toBeVisible()
  })
})
