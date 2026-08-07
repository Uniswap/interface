import React from 'react'
import { usePriceChart } from 'src/components/charts/PriceChartContext'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { getNearestFiberProp, render, within } from 'src/test/test-utils'
import { amounts } from 'uniswap/src/test/fixtures'
import type { Mock } from 'vitest'

vi.mock('src/components/charts/PriceChartContext')
const mockedUsePriceChart = usePriceChart as Mock

describe(PriceText, () => {
  it('renders without error', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp: 0, value: amounts.md().value }],
      currentIndex: { value: -1 },
      isActive: { value: false },
    })

    const tree = render(<PriceText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders without error less than a dollar', () => {
    mockedUsePriceChart.mockReturnValue({
      data: [{ timestamp: 0, value: amounts.xs().value }],
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
      data: [{ timestamp: 0, value: amounts.sm().value }],
      currentIndex: { value: 0 },
      isActive: { value: true },
    })

    const tree = render(<PriceText loading={false} />)

    const animatedText = await tree.findByTestId('price-text')
    const wholePart = await within(animatedText).findByTestId('wholePart')
    const decimalPart = await within(animatedText).findByTestId('decimalPart')

    expect(getNearestFiberProp(wholePart, 'text')).toBe(`$${amounts.sm().value}`)
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

    const text = await tree.findByTestId('relative-change-text')
    expect(getNearestFiberProp(text, 'text')).toBe(`10.00%`)
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
