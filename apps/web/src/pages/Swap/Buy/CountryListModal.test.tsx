import { CountryListModal } from 'pages/Swap/Buy/CountryListModal'
import { US } from 'test-utils/constants'
import { act, fireEvent, render, screen } from 'test-utils/render'

vi.mock('react-virtualized-auto-sizer', () => {
  return {
    default: ({ children }: { children: any }) => children({ width: 100, height: 100 }),
  }
})

describe('CountryListModal', () => {
  it('should render options and call select callback', async () => {
    const closeHandler = vi.fn()
    const selectHandler = vi.fn()
    const result = await act(async () => {
      return render(
        <CountryListModal
          countryList={[US]}
          isOpen={true}
          onDismiss={closeHandler}
          onSelectCountry={selectHandler}
          selectedCountry={US}
        />,
      )
    })
    screen.getByText('United States').click()
    expect(selectHandler).toHaveBeenCalledWith(US)

    expect(result.container.firstChild).toMatchSnapshot()
  })

  it('should render options and call close callback', () => {
    const closeHandler = vi.fn()
    const selectHandler = vi.fn()
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
