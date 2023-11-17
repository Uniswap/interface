import { fireEvent, render, screen } from 'test-utils/render'
import noop from 'utils/noop'

import { ResizingTextArea, TextInput } from './'

describe('TextInput', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <TextInput
        className="testing"
        value="My test input"
        onUserInput={noop}
        placeholder="Test Placeholder"
        fontSize="12"
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('calls the handler on user input', () => {
    const onUserInputSpy = jest.fn()
    render(
      <TextInput
        className="testing"
        value=""
        onUserInput={onUserInputSpy}
        placeholder="Test Placeholder"
        fontSize="12"
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Test Placeholder'), { target: { value: 'New value' } })

    expect(onUserInputSpy).toHaveBeenCalledWith('New value')
    expect(onUserInputSpy).toHaveBeenCalledTimes(1)
  })
})

describe('ResizableTextArea', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <ResizingTextArea
        className="testing"
        value="My test input"
        onUserInput={noop}
        placeholder="Test Placeholder"
        fontSize="12"
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('calls the handler on user input', () => {
    const onUserInputSpy = jest.fn()
    render(
      <ResizingTextArea
        className="testing"
        value=""
        onUserInput={onUserInputSpy}
        placeholder="Test Placeholder"
        fontSize="12"
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Test Placeholder'), { target: { value: 'New value' } })

    expect(onUserInputSpy).toHaveBeenCalledWith('New value')
    expect(onUserInputSpy).toHaveBeenCalledTimes(1)
  })
})
