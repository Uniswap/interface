import { ValueText } from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { render } from 'uniswap/src/test/test-utils'

describe('ValueText', () => {
  it('renders formatted USD value as text', () => {
    const { getByText } = render(<ValueText value="$1.23" />)
    expect(getByText('$1.23')).toBeTruthy()
  })

  it('renders dash as static text when no price is available and not loading', () => {
    const { getByText } = render(<ValueText value="-" isLoading={false} />)
    expect(getByText('-')).toBeTruthy()
  })

  it('renders loading shimmer when isLoading is true', () => {
    const { queryByText } = render(<ValueText value="-" isLoading={true} />)
    expect(queryByText('-')).toBeNull()
  })

  it('does not render loading shimmer when isLoading is false', () => {
    const { getByText } = render(<ValueText value="$1.23" isLoading={false} />)
    expect(getByText('$1.23')).toBeTruthy()
  })
})
