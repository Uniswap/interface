import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { Portfolio } from '~/pages/Portfolio/Portfolio'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

vi.mock('~/pages/Portfolio/hooks/useShowDemoView', () => ({
  useShowDemoView: vi.fn(),
}))

vi.mock('~/pages/Portfolio/PortfolioPageInner', () => ({
  PortfolioPageInner: ({ mb }: { mb?: number }) => (
    <div data-testid="portfolio-page-inner" data-mb={mb}>
      Portfolio Page Inner Mock
    </div>
  ),
}))

describe('Portfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render connected view correctly', () => {
    mocked(useShowDemoView).mockReturnValue(false)

    const { container } = render(<Portfolio />)
    expect(container).toMatchSnapshot()
  })

  it('should render demo view correctly when user is not connected', () => {
    mocked(useShowDemoView).mockReturnValue(true)

    const { container } = render(<Portfolio />)
    expect(container).toMatchSnapshot()
  })
})
