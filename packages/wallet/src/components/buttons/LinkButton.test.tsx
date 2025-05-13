import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
import { fireEvent, render } from 'wallet/src/test/test-utils'

jest.mock('uniswap/src/utils/linking')

describe(LinkButton, () => {
  it('renders without error', () => {
    const tree = render(<LinkButton label="link text" url="https://example.com" />)

    expect(tree).toMatchSnapshot()
  })

  it('renders button with specified label', async () => {
    const { queryByText } = render(<LinkButton label="link text" url="https://example.com" />)

    expect(queryByText('link text')).toBeDefined()
  })

  describe('when pressed', () => {
    const cases = [
      { openExternalBrowser: false, isSafeUri: false },
      { openExternalBrowser: true, isSafeUri: false },
      { openExternalBrowser: false, isSafeUri: true },
      { openExternalBrowser: true, isSafeUri: true },
    ]

    it.each(cases)('calls openUri with %p', async ({ openExternalBrowser, isSafeUri }) => {
      const { getByText } = render(
        <LinkButton
          isSafeUri={isSafeUri}
          label="link text"
          openExternalBrowser={openExternalBrowser}
          url="https://example.com"
        />,
      )

      const button = getByText('link text')
      fireEvent.press(button, ON_PRESS_EVENT_PAYLOAD)

      expect(require('uniswap/src/utils/linking').openUri).toHaveBeenCalledWith(
        'https://example.com',
        openExternalBrowser,
        isSafeUri,
      )
    })
  })
})
