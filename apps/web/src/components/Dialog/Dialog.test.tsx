import '@testing-library/jest-dom/extend-expect'

import { Dialog, DialogButtonType } from 'components/Dialog/Dialog'
import { fireEvent, render, screen } from 'test-utils/render'

const mockIcon = <div>Mock Icon</div>
const mockTitle = <div>Mock Title</div>
const mockDescription = <div>Mock Description</div>
const mockBody = <div>Mock Body</div>

const mockOnCancel = jest.fn()
const mockLeftClick = jest.fn()
const mockRightClick = jest.fn()

const mockButtonsConfig = {
  left: {
    title: <div>Left Button</div>,
    onClick: mockLeftClick,
  },
  right: {
    title: <div>Right Button</div>,
    onClick: mockRightClick,
  },
}

describe('<Dialog />', () => {
  it('renders the Dialog component correctly', () => {
    render(
      <Dialog
        isVisible={true}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
        buttonsConfig={mockButtonsConfig}
      />
    )

    expect(document.body).toMatchSnapshot()

    expect(screen.getByText('Mock Icon')).toBeInTheDocument()
    expect(screen.getByText('Mock Title')).toBeInTheDocument()
    expect(screen.getByText('Mock Description')).toBeInTheDocument()
    expect(screen.getByText('Mock Body')).toBeInTheDocument()
    expect(screen.getByText('Left Button')).toBeInTheDocument()
    expect(screen.getByText('Right Button')).toBeInTheDocument()
  })

  it('handles cancel button click', () => {
    render(
      <Dialog
        isVisible={true}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
        buttonsConfig={mockButtonsConfig}
      />
    )

    fireEvent.click(screen.getByTestId('Dialog-closeButton'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('handles left button click', () => {
    render(
      <Dialog
        isVisible={true}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
        buttonsConfig={mockButtonsConfig}
      />
    )

    fireEvent.click(screen.getByText('Left Button'))
    expect(mockLeftClick).toHaveBeenCalled()
  })

  it('handles right button click', () => {
    render(
      <Dialog
        isVisible={true}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
        buttonsConfig={mockButtonsConfig}
      />
    )

    fireEvent.click(screen.getByText('Right Button'))
    expect(mockRightClick).toHaveBeenCalled()
  })

  it('renders no buttons if not provided', () => {
    render(
      <Dialog
        isVisible={true}
        buttonsConfig={{}}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.queryByText('Left Button')).not.toBeInTheDocument()
    expect(screen.queryByText('Right Button')).not.toBeInTheDocument()
  })

  it('renders different button types', () => {
    render(
      <Dialog
        isVisible={true}
        buttonsConfig={{
          left: {
            ...mockButtonsConfig.left,
            disabled: true,
          },
          right: {
            ...mockButtonsConfig.right,
            type: DialogButtonType.Error,
          },
        }}
        icon={mockIcon}
        title={mockTitle}
        description={mockDescription}
        body={mockBody}
        onCancel={mockOnCancel}
      />
    )

    expect(document.body).toMatchSnapshot()

    expect(screen.queryByText('Left Button')).toBeInTheDocument()
    expect(screen.queryByText('Right Button')).toBeInTheDocument()
  })
})
