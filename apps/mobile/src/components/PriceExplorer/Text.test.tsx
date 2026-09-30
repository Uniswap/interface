import React from 'react'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { getNearestFiberProp, render, waitFor, within } from 'src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('src/components/charts/PriceChartContext')
const mockedUsePriceChart = usePriceChart as Mock

const { mockUseFeatureFlag } = vi.hoisted(() => ({ mockUseFeatureFlag: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

// `RelativeChange` with `shouldAnimate` mounts AnimatedNumber's ReanimatedNumber, which calls
// `i18next.dir()` -- unsupported by the global `uniswap/src/i18n` test mock (no other test in the
// repo exercises `shouldAnimate=true` today). Mock the child component so this file can still
// assert which branch `RelativeChangeText` picks and with which props, without depending on that
// unrelated environment gap.
vi.mock('uniswap/src/components/RelativeChange/RelativeChange', () => ({
  RelativeChange: (props: { change?: number; absoluteChange?: number }) => (
    <div data-change={props.change} data-testid="relative-change-idle-fast-path" />
  ),
}))

beforeEach(() => {
  // Matches the real Statsig client's default in these tests (gate closed) unless a test opts in below.
  mockUseFeatureFlag.mockReturnValue(false)
})

describe(PriceText, () => {
  it('renders without error', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp: 0, value: 55 }],
      currentIndex: { value: -1 },
      isActive: { value: false },
    })

    const tree = render(<PriceText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders without error less than a dollar', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp: 0, value: 0.05 }],
      currentIndex: { value: -1 },
      isActive: { value: false },
    })

    const tree = render(<PriceText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [],
      currentIndex: { value: -1 },
      isActive: { value: false },
    })

    const tree = render(<PriceText loading={true} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active price when scrubbing', async () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp: 0, value: 5 }],
      currentIndex: { value: 0 },
      isActive: { value: true },
    })

    const tree = render(<PriceText loading={false} />)

    const animatedText = await tree.findByTestId('price-text')
    const wholePart = await within(animatedText).findByTestId('wholePart')
    const decimalPart = await within(animatedText).findByTestId('decimalPart')

    expect(getNearestFiberProp(wholePart, 'text')).toBe(`$5`)
    expect(getNearestFiberProp(decimalPart, 'text')).toBe(`.00`)
  })
})

describe(RelativeChangeText, () => {
  it('renders without error', () => {
    mockedUsePriceChart.mockReturnValue({
      isActive: { value: false },
      data: [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 9 },
      ],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUsePriceChart.mockReturnValue({
      isActive: { value: false },
      data: [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 9 },
      ],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={true} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active relative change when scrubbing', async () => {
    mockedUsePriceChart.mockReturnValue({
      isActive: { value: true },
      data: [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 9 },
      ],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={false} />)

    // Rendered via plain React state (not an animatedProps `text` prop on a native TextInput) so
    // that content changes always get a real measure+layout pass -- see CONS-2883.
    const text = await tree.findByTestId('relative-change-text')
    await waitFor(() => {
      expect((text as unknown as HTMLElement).textContent).toBe('10.00%')
    })
  })

  it('shows the relativeChangeIdle fast path when spotRelativeChangeIdle is provided while idle', async () => {
    mockedUsePriceChart.mockReturnValue({
      isActive: { value: false },
      data: [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 9 },
      ],
      currentIndex: { value: 1 },
    })

    // Same shape/value as the hook-level `relativeChangeIdle` assertions in usePriceHistory.test.ts --
    // a plain JS mirror of the spot relative change, computed synchronously alongside the fiat delta.
    const tree = render(<RelativeChangeText loading={false} spotRelativeChangeIdle={12.3} />)

    // The fast path renders `RelativeChange` driven directly by the plain `spotRelativeChangeIdle`
    // prop (not the runOnJS-bridged `combinedTextValue` state) -- see CONS-2883.
    const fastPathNode = await tree.findByTestId('relative-change-idle-fast-path')
    expect((fastPathNode as unknown as HTMLElement).getAttribute('data-change')).toBe('12.3')
    expect(tree.queryByTestId('relative-change-text')).toBeNull()
  })
})

describe(DatetimeText, () => {
  // 2023-11-01T00:00:00.000Z
  const timestamp = 1698796800000

  it('renders without error', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp, value: 1 }],
      currentIndex: { value: 0 },
      isActive: { value: true },
    })
    const tree = render(<DatetimeText loading={false} />)

    expect((tree.container.querySelector('div') as HTMLElement).style.opacity).toBe('1')
    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp, value: 1 }],
      currentIndex: { value: 0 },
      isActive: { value: true },
    })
    const tree = render(<DatetimeText loading={true} />)

    expect((tree.container.querySelector('div') as HTMLElement).style.opacity).toBe('0')
  })
})
