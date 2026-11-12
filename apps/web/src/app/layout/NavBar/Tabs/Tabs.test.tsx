import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Tabs } from '~/app/layout/NavBar/Tabs/Tabs'
import { useTabsContent } from '~/app/layout/NavBar/Tabs/TabsContent'
import { render, screen } from '~/test-utils/render'

vi.mock('~/app/layout/NavBar/Tabs/TabsContent', () => ({ useTabsContent: vi.fn() }))

describe('Tabs', () => {
  beforeEach(() => {
    vi.mocked(useTabsContent).mockReturnValue([
      {
        title: 'Explore',
        href: '/explore',
        isActive: false,
        elementName: ElementName.NavbarExploreTab,
      },
      {
        title: 'Pool',
        href: '/positions',
        isActive: true,
        elementName: ElementName.NavbarPoolTab,
      },
    ])
  })

  it.each(['/explore/pools/base', '/explore/hooks/base', '/liquidity/launch-auction'])(
    'announces the visually selected Pool destination at %s',
    (path) => {
      window.history.replaceState({}, '', path)
      render(<Tabs />)

      expect(screen.getByRole('link', { name: 'Pool' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Explore' })).not.toHaveAttribute('aria-current')
    },
  )
})
