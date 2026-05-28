import React from 'react'
import * as charts from 'react-native-wagmi-charts'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { render, within } from 'src/test/test-utils'
import { amounts } from 'uniswap/src/test/fixtures'

jest.mock('react-native-wagmi-charts')
const mockedUseLineChartPrice = charts.useLineChartPrice as jest.Mock
const mockedUseLineChart = charts.useLineChart as jest.Mock
const mockedUseLineChartDatetime = charts.useLineChartDatetime as jest.Mock

describe(PriceText, () => {
  it('renders without error', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })
    mockedUseLineChart.mockReturnValue({ data: [{ timestamp: 0, value: amounts.md().value }] })

    const tree = render(<PriceText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders without error less than a dollar', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })
    mockedUseLineChart.mockReturnValue({ data: [{ timestamp: 0, value: amounts.xs().value }] })

    const tree = render(<PriceText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })
    mockedUseLineChart.mockReturnValue({ data: [] })

    const tree = render(<PriceText loading={true} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active price when scrubbing', async () => {
    mockedUseLineChartPrice.mockReturnValue({
      value: { value: amounts.sm().value.toString() },
    })

    const tree = render(<PriceText loading={false} />)

    const animatedText = await tree.findByTestId('price-text')
    const wholePart = await within(animatedText).findByTestId('wholePart')
    const decimalPart = await within(animatedText).findByTestId('decimalPart')

    expect(wholePart.props.text).toBe(`$${amounts.sm().value}`)
    expect(decimalPart.props.text).toBe(`.00`)
  })
})

describe(RelativeChangeText, () => {
  it('renders without error', () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: false },
      data: [{ value: 10 }, { value: 9 }],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: false },
      data: [{ value: 10 }, { value: 9 }],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={true} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active relative change when scrubbing', async () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: true },
      data: [{ value: 10 }, { value: 9 }],
      currentIndex: { value: 1 },
    })

    const tree = render(<RelativeChangeText loading={false} />)

    const text = await tree.findByTestId('relative-change-text')
    expect(text.props.value).toBe(`10.00%`)
  })
})

describe(DatetimeText, () => {
  it('renders without error', () => {
    mockedUseLineChartDatetime.mockReturnValue({
      value: { value: '123' },
      formatted: { value: 'Thursday, November 1st, 2023' },
    })
    const tree = render(<DatetimeText loading={false} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUseLineChartDatetime.mockReturnValue({
      value: { value: '123' },
      formatted: { value: 'Thursday, November 1st, 2023' },
    })
    const tree = render(<DatetimeText loading={true} />)

    expect(tree).toMatchSnapshot()
  })
})
