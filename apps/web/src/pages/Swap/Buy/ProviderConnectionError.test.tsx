import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { mockServiceProvider } from 'pages/Swap/Buy/test/constants'
import { fireEvent, render, screen } from 'test-utils/render'

describe('ProviderConnectionError', () => {
  it('should render the component and call callbacks', () => {
    const onBack = vi.fn()
    const closeModal = vi.fn()

    const { container } = render(
      <ProviderConnectionError onBack={onBack} closeModal={closeModal} selectedServiceProvider={mockServiceProvider} />,
    )

    expect(container.firstChild).toMatchSnapshot()

    fireEvent.click(screen.getByTestId('ConnectingViewWrapper-close'))
    expect(closeModal).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('ConnectingViewWrapper-back'))
    expect(onBack).toHaveBeenCalled()

    screen.getByText('Something went wrong connecting with Test Provider.')
  })
})
