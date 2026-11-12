import type { ComponentProps } from 'react'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { openUri } from 'uniswap/src/utils/linking'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
import { fireEvent, render } from 'wallet/src/test/test-utils'

vi.mock('uniswap/src/utils/linking')

const { iconColorSpy } = vi.hoisted(() => ({ iconColorSpy: vi.fn() }))

// The icon renders no color into the DOM, so the snapshot cannot cover it; spy on the prop instead.
vi.mock('@universe/mycelium/icons/ExternalLink', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/icons/ExternalLink')>()
  const ActualExternalLink = actual.ExternalLink
  function ExternalLink(props: ComponentProps<typeof ActualExternalLink>): JSX.Element {
    iconColorSpy(props.color)
    return <ActualExternalLink {...props} />
  }
  return { ...actual, ExternalLink }
})

// What useSporeColors resolves accent1 to, i.e. the fallback LinkButton passes when no color is set.
const ACCENT1 = 'var(--accent1)'

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

    it.each(cases)('calls openUri with %o', async ({ openExternalBrowser, isSafeUri }) => {
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

      expect(openUri).toHaveBeenCalledWith({
        uri: 'https://example.com',
        openExternalBrowser,
        isSafeUri,
      })
    })
  })

  describe('icon color', () => {
    it('defaults to accent1', () => {
      render(<LinkButton label="link text" url="https://example.com" />)

      expect(iconColorSpy).toHaveBeenLastCalledWith(ACCENT1)
    })

    it('uses the color prop when no iconColor is given', () => {
      render(<LinkButton color="#00ff00" label="link text" url="https://example.com" />)

      expect(iconColorSpy).toHaveBeenLastCalledWith('#00ff00')
    })

    it('prefers iconColor over color', () => {
      render(<LinkButton color="#00ff00" iconColor="#ff0000" label="link text" url="https://example.com" />)

      expect(iconColorSpy).toHaveBeenLastCalledWith('#ff0000')
    })
  })
})
