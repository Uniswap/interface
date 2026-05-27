import { FormattedAmountWithMutedDecimals } from 'uniswap/src/components/text/FormattedAmountWithMutedDecimals'
import { renderWithProviders } from 'uniswap/src/test/render'

describe(FormattedAmountWithMutedDecimals, () => {
  it('splits decimal text into a separate text node', () => {
    const { getByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="$1,234.56" color="$neutral1" variant="body3" />,
    )

    expect(getByText('$1,234')).toBeTruthy()
    expect(getByText('.56')).toBeTruthy()
  })

  it('keeps a trailing currency suffix in its own node', () => {
    const { getByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="1,234.50 USD" color="$neutral1" variant="body3" />,
    )

    expect(getByText('1,234')).toBeTruthy()
    expect(getByText('.50')).toBeTruthy()
    expect(getByText('USD')).toBeTruthy()
  })

  it('preserves a leading sign in the leading text node', () => {
    const { getByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="-$1,000.50" color="$neutral1" variant="body3" />,
    )

    expect(getByText('-$1,000')).toBeTruthy()
    expect(getByText('.50')).toBeTruthy()
  })

  it('handles the small-amount "<$0.01" formatter output', () => {
    const { getByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="<$0.01" color="$neutral1" variant="body3" />,
    )

    expect(getByText('<$0')).toBeTruthy()
    expect(getByText('.01')).toBeTruthy()
  })

  it('splits at the trailing comma for comma-decimal locales', () => {
    const { getByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="$1.234,56" color="$neutral1" variant="body3" />,
    )

    expect(getByText('$1.234')).toBeTruthy()
    expect(getByText(',56')).toBeTruthy()
  })

  it('does not split an integer-only amount whose only separator is a thousand group', () => {
    const { getByText, queryByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="$1,000" color="$neutral1" variant="body3" />,
    )

    expect(getByText('$1,000')).toBeTruthy()
    expect(queryByText(',000')).toBeNull()
  })

  it('does not split an integer-only amount without separators', () => {
    const { getByText, queryByText } = renderWithProviders(
      <FormattedAmountWithMutedDecimals amount="$0" color="$neutral1" variant="body3" />,
    )

    expect(getByText('$0')).toBeTruthy()
    expect(queryByText('$')).toBeNull()
  })

  it('renders a loading skeleton when loading is true', () => {
    const { getByTestId } = renderWithProviders(
      <FormattedAmountWithMutedDecimals
        amount="$1,234.56"
        color="$neutral1"
        variant="body3"
        loading
        testID="muted-amount"
      />,
    )

    expect(getByTestId('muted-amount')).toBeTruthy()
  })
})
