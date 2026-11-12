import { render, screen } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { MemoryRouter } from 'react-router'
import { Header } from '~/app/layout/Header'
import { useScroll } from '~/hooks/useScroll'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))
vi.mock('~/hooks/useScroll', () => ({ useScroll: vi.fn() }))
vi.mock('~/app/layout/NavBar/index', () => ({ Navbar: () => <nav aria-label="Main navigation" /> }))
vi.mock('~/components/TopLevelBanners/MobileAppPromoBanner', () => ({
  MobileAppPromoBanner: () => null,
  useMobileAppPromoBannerEligible: () => false,
}))
vi.mock('~/components/TopLevelBanners/UkBanner', () => ({
  UkBanner: () => null,
  useRenderUkBanner: () => false,
}))

function renderHeader(pathname: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Header />
    </MemoryRouter>,
  )

  const surface = screen.getByRole('navigation', { name: 'Main navigation' }).parentElement
  if (!surface) {
    throw new Error('Expected a navigation surface')
  }
  return surface
}

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
    vi.mocked(useScroll).mockReturnValue({ direction: undefined, isScrolledDown: false })
    vi.mocked(useMedia).mockReturnValue({ md: false, xl: false } as ReturnType<typeof useMedia>)
  })

  it.each([
    { pathname: '/explore/pools', mobile: false },
    { pathname: '/explore/pools/base', mobile: false },
    { pathname: '/explore/pools/base/', mobile: false },
    { pathname: '/explore/pools', mobile: true },
    { pathname: '/explore/pools/base', mobile: true },
    { pathname: '/explore/pools/base/', mobile: true },
  ])('reveals the Pools hero at $pathname with mobile=$mobile', ({ pathname, mobile }) => {
    vi.mocked(useMedia).mockReturnValue({ md: mobile, xl: mobile } as ReturnType<typeof useMedia>)
    expect(renderHeader(pathname)).toHaveClass('bg-[transparent]')
  })

  it.each(['/explore/hooks', '/explore/hooks/base', '/explore/hooks/base/'])(
    'reveals the Hooks background on desktop at %s',
    (pathname) => {
      expect(renderHeader(pathname)).toHaveClass('bg-[transparent]')
    },
  )

  it.each(['/explore/hooks', '/explore/hooks/base'])('reveals the mobile Hooks background at %s', (pathname) => {
    vi.mocked(useMedia).mockReturnValue({ md: true, xl: true } as ReturnType<typeof useMedia>)
    expect(renderHeader(pathname)).toHaveClass('bg-[transparent]')
  })

  it.each([
    '/explore',
    '/explore/tokens/base',
    '/explore/transactions',
    '/explore/pools/base/0x1234',
    '/explore/hooks/base/0x1234',
    '/explore/pools-other/base',
    '/explore/hooks-other/base',
  ])('keeps other Explore pages and detail routes opaque at %s', (pathname) => {
    expect(renderHeader(pathname)).toHaveClass('bg-surface1')
  })

  it.each(['/explore/pools/base', '/explore/hooks/base'])(
    'keeps the legacy header when Hooks Explore is disabled at %s',
    (pathname) => {
      vi.mocked(useFeatureFlag).mockReturnValue(false)
      expect(renderHeader(pathname)).toHaveClass('bg-surface1')
    },
  )

  it.each(['/explore/pools/base', '/explore/hooks/base'])('keeps the scrolled navigation opaque at %s', (pathname) => {
    vi.mocked(useScroll).mockReturnValue({ direction: undefined, isScrolledDown: true })
    expect(renderHeader(pathname)).toHaveClass('bg-surface1')
  })

  it('preserves the opaque Portfolio header', () => {
    expect(renderHeader('/portfolio')).toHaveClass('bg-surface1')
  })

  it('preserves the opaque Margin terminal header', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    expect(renderHeader('/margin')).toHaveClass('bg-surface1')
  })

  it.each(['/positions', '/swap', '/margin'])(
    'preserves the transparent unscrolled header elsewhere at %s',
    (pathname) => {
      expect(renderHeader(pathname)).toHaveClass('bg-[transparent]')
    },
  )
})
