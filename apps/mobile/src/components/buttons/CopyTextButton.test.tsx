import { act, fireEvent, render } from 'src/test/test-utils'
import { setClipboard } from 'wallet/src/utils/clipboard'
import { CopyTextButton } from './CopyTextButton'

jest.mock('wallet/src/utils/clipboard')

describe(CopyTextButton, () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders without error', () => {
    const tree = render(<CopyTextButton copyText="copy text" />)

    expect(tree).toMatchSnapshot()
  })

  it('copies text when pressed', async () => {
    const { getByText } = render(<CopyTextButton copyText="copy text" />)

    const button = getByText('Copy')
    await act(async () => {
      fireEvent.press(button)
    })

    expect(setClipboard).toHaveBeenCalledWith('copy text')
  })

  it('changes button text when text is copied and brings back original text after timeout', async () => {
    const { queryByText, getByText } = render(<CopyTextButton copyText="copy text" />)

    const button = getByText('Copy')
    await act(async () => {
      fireEvent.press(button)
    })

    expect(queryByText('Copied')).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    expect(queryByText('Copy')).toBeTruthy()
  })
})
