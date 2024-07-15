import { fireEvent } from '@testing-library/react-native'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { renderWithProviders } from 'uniswap/src/test/render'
import { openUri } from 'uniswap/src/utils/linking'

jest.mock('uniswap/src/utils/linking', () => ({
  openUri: jest.fn(),
}))

describe(LearnMoreLink, () => {
  it('renders without error', () => {
    const tree = renderWithProviders(<LearnMoreLink url="https://example.com" />)

    expect(tree).toMatchSnapshot()
  })

  it('renders a learn more link', () => {
    const { queryByText } = renderWithProviders(<LearnMoreLink url="https://example.com" />)

    const learnMoreLink = queryByText('Learn more')

    expect(learnMoreLink).toBeTruthy()
  })

  it('calls openUri when pressed', () => {
    const { getByText } = renderWithProviders(<LearnMoreLink url="https://example.com" />)

    const learnMoreLink = getByText('Learn more')
    fireEvent.press(learnMoreLink, ON_PRESS_EVENT_PAYLOAD)

    expect(openUri).toHaveBeenCalledTimes(1)
    expect(openUri).toHaveBeenCalledWith('https://example.com')
  })
})
