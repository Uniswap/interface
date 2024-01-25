import { fireEvent, render } from '@testing-library/react-native'
import { ON_PRESS_EVENT_PAYLOAD } from 'wallet/src/test/eventFixtures'
import { openUri } from 'wallet/src/utils/linking'
import { LearnMoreLink } from './LearnMoreLink'

jest.mock('wallet/src/utils/linking', () => ({
  openUri: jest.fn(),
}))

describe(LearnMoreLink, () => {
  it('renders without error', () => {
    const tree = render(<LearnMoreLink url="https://example.com" />)

    expect(tree).toMatchSnapshot()
  })

  it('renders a learn more link', () => {
    const { queryByText } = render(<LearnMoreLink url="https://example.com" />)

    const learnMoreLink = queryByText('Learn more')

    expect(learnMoreLink).toBeTruthy()
  })

  it('calls openUri when pressed', () => {
    const { getByText } = render(<LearnMoreLink url="https://example.com" />)

    const learnMoreLink = getByText('Learn more')
    fireEvent.press(learnMoreLink, ON_PRESS_EVENT_PAYLOAD)

    expect(openUri).toHaveBeenCalledTimes(1)
    expect(openUri).toHaveBeenCalledWith('https://example.com')
  })
})
