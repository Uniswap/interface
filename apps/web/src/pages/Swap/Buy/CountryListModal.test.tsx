import { CountryListModal } from 'pages/Swap/Buy/CountryListModal'
import { US } from 'test-utils/constants'
import { fireEvent, render, screen } from 'test-utils/render'

jest.mock(
  'react-virtualized-auto-sizer',
  () =>
    ({ children }: { children: any }) =>
      children({ width: 100, height: 100 }),
)

describe('CountryListModal', () => {
  it('should render options and call select callback', () => {
    const closeHandler = jest.fn()
    const selectHandler = jest.fn()
    const { container } = render(
      <CountryListModal
        countryList={[US]}
        isOpen={true}
        onDismiss={closeHandler}
        onSelectCountry={selectHandler}
        selectedCountry={US}
      />,
    )
    screen.getByText('United States').click()
    expect(selectHandler).toHaveBeenCalledWith(US)

    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render options and call close callback', () => {
    const closeHandler = jest.fn()
    const selectHandler = jest.fn()
    render(
      <CountryListModal
        countryList={[US]}
        isOpen={true}
        onDismiss={closeHandler}
        onSelectCountry={selectHandler}
        selectedCountry={US}
      />,
    )
    const closeButton = screen.getByTestId('CountryListModal-close')
    fireEvent(closeButton, new MouseEvent('click', { bubbles: true }))
    expect(closeHandler).toHaveBeenCalled()
  })
})
