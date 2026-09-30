import '~/test-utils/tokens/mocks'
import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { shortenHash } from 'utilities/src/addresses'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { PoolsDetailsChartType } from '~/pages/PoolDetails/components/ChartSection'
import { PoolDetailsBreadcrumb } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsBreadcrumb'
import { PoolDetailsHeader } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeader'
import store from '~/state'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { usdcWethPoolAddress, validParsedPoolToken0, validParsedPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

// Passthrough spy: real engine behaviour, observable inputs.
vi.mock('uniswap/src/features/fees/getFeeBreakdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/fees/getFeeBreakdown')>()
  return { ...actual, getFeeBreakdown: vi.fn(actual.getFeeBreakdown) }
})

// jsdom has no layout, so generated class names are the only handle on the style decisions below.
// Every class-name literal lives here and each lookup throws naming what it wanted rather than
// failing as a bare "expected not null". A compat media bucket carries its value in a var twin, so
// the resolved value lives in the inline custom property, not in the class name — assert both.
const COMPAT_CLASS = {
  wrappingRow: 'flex-wrap',
  shrinkable: 'shrink',
  fontSize: 'text-[',
  topPadding48: 'pt-[48px]',
  mdTopPadding: 'media-md:pt-[var(--cE-pt)]',
} as const

function closestByClassOrThrow(from: HTMLElement, classToken: string, what: string): HTMLElement {
  let node: HTMLElement | null = from
  while (node) {
    if (node.classList.contains(classToken)) {
      return node
    }
    node = node.parentElement
  }
  throw new Error(`no ${what} ancestor (.${classToken}) above "${from.textContent}"`)
}

const expectWrappingRow = (from: HTMLElement): HTMLElement =>
  closestByClassOrThrow(from, COMPAT_CLASS.wrappingRow, 'wrapping')

const expectShrinkable = (from: HTMLElement): HTMLElement =>
  closestByClassOrThrow(from, COMPAT_CLASS.shrinkable, 'shrinkable')

const classWithPrefix = (el: HTMLElement, prefix: string): string | undefined =>
  el.className.split(' ').find((token) => token.startsWith(prefix))

function parentOrThrow(el: HTMLElement, what: string): HTMLElement {
  const parent = el.parentElement
  if (!parent) {
    throw new Error(`no parent for ${what}`)
  }
  return parent
}

/** Gap classes as each system renders them: mycelium `gap-[Npx]` / `media-md:gap-[Npx]`, tamagui `_gap-*`. */
const compatGapClasses = (el: HTMLElement): string[] =>
  Array.from(el.classList)
    .filter((token) => /(^|:)gap-\[/.test(token))
    .sort()

function fontSizeClass(el: HTMLElement): string {
  const found = classWithPrefix(el, COMPAT_CLASS.fontSize)
  if (!found) {
    throw new Error(`no font size class (${COMPAT_CLASS.fontSize}*) on "${el.textContent}"`)
  }
  // A var twin spells the same class at both sizes, so fold the resolved value in or the two
  // readings compare equal and the size switch looks intact when it is gone.
  return found.includes('var(') ? `${found}=${el.style.getPropertyValue('--c-text')}` : found
}

describe('PoolDetailsHeader', () => {
  beforeEach(() => {
    // jsdom is 1024px wide, i.e. the xl breakpoint: md is false, so this is the desktop treatment.
    mockMediaSize('xl')
    mocked(useFeatureFlag).mockReturnValue(false)
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
  })

  const mockBreadcrumbProps = {
    token0: validParsedPoolToken0,
    token1: validParsedPoolToken1,
    poolAddress: usdcWethPoolAddress,
  }

  const mockHeaderProps = {
    chainId: 1,
    poolAddress: usdcWethPoolAddress,
    token0: validParsedPoolToken0,
    token1: validParsedPoolToken1,
    chartType: ChartType.PRICE as PoolsDetailsChartType,
    onChartTypeChange: vi.fn(),
    priceChartType: PriceChartType.LINE,
    onPriceChartTypeChange: vi.fn(),
    feeTier: { feeAmount: 500, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false },
    toggleReversed: vi.fn(),
    isCompact: false,
  }

  it('loading skeleton is shown', () => {
    const { asFragment } = render(<PoolDetailsHeader {...mockHeaderProps} loading={true} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId(TestID.PoolDetailsHeaderLoadingSkeleton)).toBeInTheDocument()
  })

  it('renders breadcrumb text correctly', () => {
    const { asFragment } = render(<PoolDetailsBreadcrumb {...mockBreadcrumbProps} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Pools/i)).toBeInTheDocument()
    expect(screen.getAllByText(/USDC\s*\/\s*WETH/i).length).toBeGreaterThan(0)
  })

  it('zeroes its top padding on mWeb, so the crumb sits level with the TDP breadcrumb', () => {
    render(<PoolDetailsBreadcrumb {...mockBreadcrumbProps} />)

    // Assert the resolved mWeb value. Without the override this row keeps 48px of top padding on mobile
    // while TDPBreadcrumb zeroes its own, so the pool page would start 48px lower.
    const nav = screen.getByLabelText('breadcrumb-nav')
    expect(nav).toHaveClass(COMPAT_CLASS.mdTopPadding)
    // The value, not just the class: the 48px offset this replaced emits the same var-twin class, so
    // asserting the class alone would pass against the exact regression this rules out.
    expect(nav.style.getPropertyValue('--cE-pt')).toBe('0px')
    // Desktop still carries the 48px offset — only mWeb zeroes it.
    expect(nav).toHaveClass(COMPAT_CLASS.topPadding48)
  })

  it('marks the current crumb with aria-current, which the compat Flex allow-list cannot forward', () => {
    render(<PoolDetailsBreadcrumb {...mockBreadcrumbProps} />)

    expect(screen.getByTestId('current-breadcrumb')).toHaveAttribute('aria-current', 'page')
  })

  it('renders header text correctly', () => {
    const result = render(<PoolDetailsHeader {...mockHeaderProps} />)

    expect(result.asFragment()).toMatchSnapshot()

    const usdcLink = document.querySelector(
      'a[href="/explore/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]',
    )
    const wethLink = document.querySelector(
      'a[href="/explore/tokens/ethereum/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"]',
    )
    expect(usdcLink?.textContent).toBe('USDC / ')
    expect(wethLink?.textContent).toBe('WETH')
    expect(screen.getByText('0.05%')).toBeInTheDocument()
  })

  it('calls toggleReversed when arrows are clicked', async () => {
    render(<PoolDetailsHeader {...mockHeaderProps} />)

    await userEvent.click(screen.getByTestId('toggle-tokens-reverse-arrows'))

    expect(mockHeaderProps.toggleReversed).toHaveBeenCalledTimes(1)
  })

  // Every assertion above runs at xl, where `media.md` is false. These two blocks are the pair that
  // actually pins the 640px switch: the same props, rendered either side of it, must differ.
  describe('desktop (above the 640px switch)', () => {
    it('puts the network name on the second row', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      expect(screen.getByText(getChainInfo(UniverseChainId.Mainnet).label)).toBeInTheDocument()
    })

    it('does not show the icon-only copy button next to the title', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      expect(screen.queryByTestId(TestID.PoolDetailsCopyAddressButton)).toBeNull()
    })

    it('wraps the second row and lets its badges shrink, so a wide hook badge cannot overflow it', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      // Row 2 is the flex row holding both the network pill and the badges.
      const feeBadge = screen.getByText('0.05%')
      const wrappingRow = expectWrappingRow(screen.getByText(getChainInfo(UniverseChainId.Mainnet).label))
      // Confirms the wrapping ancestor is row 2 itself and not some outer page container.
      expect(wrappingRow).toContainElement(feeBadge)

      // The badges wrapper is the child that has to give: tamagui defaults these wrappers to flexShrink 0.
      expect(wrappingRow).toContainElement(expectShrinkable(feeBadge))
    })
  })

  describe('mobile web (at and below the 640px switch)', () => {
    beforeEach(() => {
      mockMediaSize('md')
    })

    it('drops the second row, so the network name is no longer shown', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      expect(screen.queryByText(getChainInfo(UniverseChainId.Mainnet).label)).toBeNull()
    })

    it('replaces the address row with an icon-only copy button beside the pool name', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      expect(screen.getByTestId(TestID.PoolDetailsCopyAddressButton)).toBeInTheDocument()
      // The pool name stays, so the address is reachable without taking a row for it.
      expect(screen.getAllByText(/USDC/).length).toBeGreaterThan(0)
    })

    it('gives the icon-only copy button an accessible name', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      // Icon-only, so without this it announces unlabeled and the address is unreachable by screen reader.
      expect(screen.getByLabelText('Copy address')).toBeInTheDocument()
    })

    it('puts the test id on the pressable itself, not on the icon inside it', () => {
      render(<PoolDetailsHeader {...mockHeaderProps} />)

      // `CopyHelper` forwards `dataTestId` to the inner copy icon and only `testID` to its TouchableArea,
      // so passing the wrong one lands this id on a plain <div>. Identity against the labelled control is
      // what pins it; a containment check would still pass with the id on the icon.
      expect(screen.getByTestId(TestID.PoolDetailsCopyAddressButton)).toBe(screen.getByLabelText('Copy address'))
    })

    it('copies the pool address when that button is pressed', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      render(<PoolDetailsHeader {...mockHeaderProps} />)
      await userEvent.click(screen.getByLabelText('Copy address'))

      expect(writeText).toHaveBeenCalledWith(usdcWethPoolAddress)
    })
  })

  it('shrinks the badges to the compact size below the switch', () => {
    // Read off the label, not the chip: the chip's font size comes from the styled `size` variant, so it
    // changes for reasons other than the compact ternary this pins.
    const feeBadgeFontSize = (): string => fontSizeClass(screen.getByText('0.05%'))

    mockMediaSize('xl')
    const desktop = render(<PoolDetailsHeader {...mockHeaderProps} />)
    const desktopFontSize = feeBadgeFontSize()
    desktop.unmount()

    mockMediaSize('md')
    render(<PoolDetailsHeader {...mockHeaderProps} />)

    // `compact` is smaller type than `default`; if the header stopped switching, these would match.
    expect(feeBadgeFontSize()).not.toBe(desktopFontSize)
  })

  // The skeleton reserves the layout the loaded header will occupy, so any responsive gap the header applies
  // to its title column has to be mirrored or the badges row jumps on load. Both sides render
  // getPoolHeaderColumnGapProps on mycelium, so the skeleton is asserted against the loaded reading
  // itself — a divergence fails, a class rename does not.
  it.each([false, true])('reserves the loaded title-column gap in the skeleton (isCompact=%s)', (isCompact) => {
    const loaded = render(<PoolDetailsHeader {...mockHeaderProps} isCompact={isCompact} />)
    const titleColumn = parentOrThrow(expectWrappingRow(screen.getByText('0.05%')), 'row 2')
    const loadedGaps = compatGapClasses(titleColumn)
    const loadedMdGapValue = titleColumn.style.getPropertyValue('--cE-gap')
    loaded.unmount()

    render(<PoolDetailsHeader {...mockHeaderProps} isCompact={isCompact} loading={true} />)
    const skeletonColumn = screen.getByTestId(TestID.PoolDetailsHeaderSkeletonTitleColumn)

    expect(loadedGaps).toEqual([`gap-[${isCompact ? 4 : 8}px]`, 'media-md:gap-[var(--cE-gap)]'].sort())
    expect(loadedMdGapValue).toBe('0px')
    expect(compatGapClasses(skeletonColumn)).toEqual(loadedGaps)
    expect(skeletonColumn.style.getPropertyValue('--cE-gap')).toBe(loadedMdGapValue)
  })

  // Regression guard for the badge relocation: the protocol fee arrives on PoolDetailsHeader but is
  // consumed by the badges, which this PR moved from PoolDetailsTitle to row 2. The prop is optional, so
  // dropping it on the way across would typecheck cleanly and silently stop rendering the v4 fee badge.
  it('threads the served protocol fee through to the relocated row-2 badges', () => {
    mocked(getFeeBreakdown).mockClear()

    render(
      <PoolDetailsHeader
        {...mockHeaderProps}
        // 500 pips = 5 bps, as served by GetPool.
        protocolFeePips={500}
        protocolVersion={ProtocolVersion.V4}
        feeTier={{ feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }}
      />,
    )

    expect(getFeeBreakdown).toHaveBeenCalledWith(expect.objectContaining({ servedProtocolFeeBps: 5 }))
    const served = mocked(getFeeBreakdown)
      .mock.results.map((result) => result.value)
      .find((breakdown) => breakdown.protocolFeeBps !== undefined)
    expect(served).toMatchObject({ protocolFeeBps: 5 })
  })

  // The header actions menu also lists the shortened address, so counting is how we isolate the header
  // row's own copy of it. Expressed as a delta rather than absolute counts so it does not pin the menu.
  it('stops spelling the pool address out in the header row below the switch', () => {
    const shortened = shortenHash(usdcWethPoolAddress)

    mockMediaSize('xl')
    const desktop = render(<PoolDetailsHeader {...mockHeaderProps} />)
    const desktopOccurrences = screen.queryAllByText(shortened).length
    desktop.unmount()

    mockMediaSize('md')
    render(<PoolDetailsHeader {...mockHeaderProps} />)
    const mobileOccurrences = screen.queryAllByText(shortened).length

    expect(desktopOccurrences).toBe(mobileOccurrences + 1)
  })
})
