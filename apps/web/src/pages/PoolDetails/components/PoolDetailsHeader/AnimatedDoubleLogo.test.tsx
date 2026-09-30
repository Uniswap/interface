import { GraphQLApi } from '@universe/api'
import { areAddressesEqual, UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { getStackedLogoWidth } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { HEADER_LOGO_SIZE } from '~/components/StickyCollapsibleHeader/constants'
import { AnimatedDoubleLogo } from '~/pages/PoolDetails/components/PoolDetailsHeader/AnimatedDoubleLogo'
import { PoolDetailsHeaderSkeleton } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderSkeleton'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { validParsedPoolToken0, validParsedPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return { ...actual, useMedia: vi.fn() }
})

const HOST = 'animated-double-logo-host'
const STACKED_WIDTH = getStackedLogoWidth(HEADER_LOGO_SIZE.expanded)
// The GraphQL fixtures type `address` as optional, so pin it down once for the logoUrl lookups below.
const TOKEN0 = validParsedPoolToken0.address ?? ''
const TOKEN1 = validParsedPoolToken1.address ?? ''
const BOTH = [TOKEN0, TOKEN1]

/** Resolves a logoUrl only for the given addresses; everything else resolves without one. */
function mockLogos(withLogos: string[]): void {
  mocked(useCurrencyInfo).mockImplementation((currencyId?: string) => {
    if (!currencyId) {
      return undefined
    }
    const address = currencyId.split('-')[1] ?? ''
    const hasLogo = withLogos.some((candidate) =>
      areAddressesEqual({
        addressInput1: { address: candidate, chainId: UniverseChainId.Mainnet },
        addressInput2: { address, chainId: UniverseChainId.Mainnet },
      }),
    )
    return {
      currency: { chainId: UniverseChainId.Mainnet, address, isToken: true },
      logoUrl: hasLogo ? 'https://example.test/logo.png' : undefined,
      currencyId,
      safetyInfo: getCurrencySafetyInfo(GraphQLApi.SafetyLevel.Verified, undefined),
    } as unknown as CurrencyInfo
  })
}

/** The parsed pool tokens, keeping the served logoUrl only for the given addresses. */
function parsedTokens(withServedLogos: string[]): [ParsedToken, ParsedToken] {
  const keepServedLogo = (token: ParsedToken): ParsedToken =>
    withServedLogos.some((candidate) =>
      areAddressesEqual({
        addressInput1: { address: candidate, chainId: UniverseChainId.Mainnet },
        addressInput2: { address: token.address ?? '', chainId: UniverseChainId.Mainnet },
      }),
    )
      ? token
      : { ...token, logoUrl: undefined }
  return [keepServedLogo(validParsedPoolToken0), keepServedLogo(validParsedPoolToken1)]
}

/** Matches a leg's currencyId whatever address casing the SDK settles on. */
function currencyIdMatching(address: string): unknown {
  return expect.stringMatching(new RegExp(`^${UniverseChainId.Mainnet}-${address}$`, 'i'))
}

function renderLogo({
  includeNetwork,
  withServedLogos = BOTH,
}: { includeNetwork?: boolean; withServedLogos?: string[] } = {}): void {
  const [token0, token1] = parsedTokens(withServedLogos)
  render(
    <div data-testid={HOST}>
      <AnimatedDoubleLogo token0={token0} token1={token1} isCompact={false} stacked includeNetwork={includeNetwork} />
    </div>,
  )
}

// jsdom has no layout, so widths are read from what each system emits: tamagui puts the value in a
// `_width-<n>px` atomic class (the still-unconverted skeleton); the mycelium compat emits a
// `w-[var(--c-w)]` class with the value in the `--c-w` inline custom property (the converted logo).
function widthPx(el: HTMLElement): number {
  const compatVarWidth = el.style.getPropertyValue('--c-w')
  if (compatVarWidth) {
    return Number.parseFloat(compatVarWidth)
  }
  const widthClass = Array.from(el.classList).find((token) => /^_width-[\d.]+px$/.test(token))
  if (!widthClass) {
    throw new Error(`no --c-w inline var or _width-*px class on ${el.className}`)
  }
  return Number.parseFloat(widthClass.replace('_width-', ''))
}

/** Width the loaded header reserves for the logo, i.e. where the pool name starts. */
function reservedWidth(): number {
  const outer = screen.getByTestId(HOST).firstElementChild
  if (!(outer instanceof HTMLElement)) {
    throw new Error('AnimatedDoubleLogo rendered no element')
  }
  return widthPx(outer)
}

describe('AnimatedDoubleLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaSize('xl')
  })

  it('reserves the stacked footprint when both logos resolve', () => {
    mockLogos(BOTH)

    renderLogo()

    expect(reservedWidth()).toBeCloseTo(STACKED_WIDTH, 1)
  })

  // The skeleton renders before the tokens resolve, so it cannot know whether both logos will load. The
  // reservation therefore has to be logo-independent, or one class of pool shifts on load. Asserted as
  // agreement with the skeleton across every logo state rather than as a fixed number on one side.
  it.each([
    ['both logos resolve', BOTH],
    ['token1 has no logoUrl', [TOKEN0]],
    ['token0 has no logoUrl', [TOKEN1]],
    ['neither has a logoUrl', [] as string[]],
  ])('reserves the same logo width loading and loaded when %s', (_label, withLogos) => {
    mockLogos(withLogos)

    const skeleton = render(<PoolDetailsHeaderSkeleton />)
    const skeletonWidth = widthPx(screen.getByTestId(TestID.PoolDetailsHeaderSkeletonLogo))
    skeleton.unmount()

    renderLogo({ withServedLogos: withLogos })

    expect(reservedWidth()).toBeCloseTo(skeletonWidth, 1)
    // Guards the agreement above against both sides settling on the wrong number.
    expect(skeletonWidth).toBeCloseTo(STACKED_WIDTH, 1)
  })

  // mWeb hides the header's second row, which is what names the network on desktop, so the badge on the
  // logo is the only network affordance there. SplitLogo does not special-case Mainnet the way
  // LogolessPlaceholder does, so Ethereum pools must still show it.
  it('shows the network badge on mWeb, including for Mainnet', () => {
    mockLogos(BOTH)
    mockMediaSize('md')

    renderLogo({ includeNetwork: true })

    expect(screen.getByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeInTheDocument()
  })

  it('suppresses the network badge when includeNetwork is false, so desktop row 2 owns it', () => {
    mockLogos(BOTH)

    renderLogo({ includeNetwork: false })

    expect(screen.queryByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeNull()
  })

  // GetPool serves both logos, so neither leg waits on (or triggers) its per-token lookup.
  it('renders both legs from the served logos without looking the tokens up', () => {
    mockLogos([])

    renderLogo()

    const sources = Array.from(screen.getByTestId(HOST).querySelectorAll('img')).map((img) => img.getAttribute('src'))
    expect(sources).toEqual(expect.arrayContaining([validParsedPoolToken0.logoUrl, validParsedPoolToken1.logoUrl]))
    expect(useCurrencyInfo).toHaveBeenCalledWith(currencyIdMatching(TOKEN0), { skip: true })
    expect(useCurrencyInfo).toHaveBeenCalledWith(currencyIdMatching(TOKEN1), { skip: true })
  })

  it('falls back to the lookup for a leg served without a logoUrl', () => {
    mockLogos(BOTH)

    renderLogo({ withServedLogos: [TOKEN0] })

    expect(useCurrencyInfo).toHaveBeenCalledWith(currencyIdMatching(TOKEN0), { skip: true })
    expect(useCurrencyInfo).toHaveBeenCalledWith(currencyIdMatching(TOKEN1), { skip: false })
  })
})
