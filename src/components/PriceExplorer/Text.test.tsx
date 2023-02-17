import React from 'react'
import * as charts from 'react-native-wagmi-charts'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { Amounts } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'

jest.mock(
  'react-native-wagmi-charts'
  // , () => {
  //   return {
  //     useLineChartDatetime: (): ValueAndFormatted<string> => (),
  //     useLineChartPrice: (): ValueAndFormatted<string> => ({
  //       value: { value: Amounts.lg.value.toString() },
  //       formatted: { value: Amounts.lg.value.toString() },
  //     }),
  //     useLineChart: (): Partial<ReturnType<typeof useLineChart>> => ({
  //       currentIndex: { value: 1 },
  //       data: [],
  //       isActive: { value: false },
  //     }),
  //   }
  // }
)
const mockedUseLineChartPrice = charts.useLineChartPrice as jest.Mock
const mockedUseLineChart = charts.useLineChart as jest.Mock
const mockedUseLineChartDatetime = charts.useLineChartDatetime as jest.Mock

describe(PriceText, () => {
  it('renders without error', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })

    const tree = render(<PriceText loading={false} spotPrice={Amounts.md.value} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders without error less than a dollar', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })

    const tree = render(<PriceText loading={false} spotPrice={Amounts.xs.value} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUseLineChartPrice.mockReturnValue({ value: '' })

    const tree = render(<PriceText loading={true} spotPrice={Amounts.md.value} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active price when scrubbing', async () => {
    mockedUseLineChartPrice.mockReturnValue({ value: { value: Amounts.sm.value.toString() } })

    const tree = render(<PriceText loading={false} spotPrice={Amounts.md.value} />)

    const text = await tree.findByTestId('price-text')
    expect(text.props.children[0]).toBe(`$${Amounts.sm.value}`)
    expect(text.props.children[1].props.children).toStrictEqual(['.', '00'])
  })

  it('shows active price when scrubbing less than a dollar', async () => {
    mockedUseLineChartPrice.mockReturnValue({ value: { value: Amounts.xs.value.toString() } })

    const tree = render(<PriceText loading={false} spotPrice={Amounts.xs.value} />)

    const text = await tree.findByTestId('price-text')
    expect(text.props.value).toBe(`$${Amounts.xs.value}00`)
  })
})

describe(RelativeChangeText, () => {
  it('renders without error', () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: false },
    })

    const tree = render(
      <RelativeChangeText loading={false} spotRelativeChange={Amounts.md.value} />
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders loading state', () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: false },
    })

    const tree = render(<RelativeChangeText loading={true} spotRelativeChange={Amounts.md.value} />)

    expect(tree).toMatchSnapshot()
  })

  it('shows active relative change when scrubbing', async () => {
    mockedUseLineChart.mockReturnValue({
      isActive: { value: true },
      data: [{ value: 9 }, { value: 10 }], // price goes from 9 to 10 = 10% change
      currentIndex: { value: 0 },
    })

    const tree = render(
      <RelativeChangeText loading={false} spotRelativeChange={Amounts.md.value} />
    )

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
