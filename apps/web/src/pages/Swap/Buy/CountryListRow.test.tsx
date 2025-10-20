import { CountryListRow } from 'pages/Swap/Buy/CountryListRow'
import { US } from 'test-utils/constants'
import { act, render, screen } from 'test-utils/render'

describe('CountryListRow', () => {
  it('should render', () => {
    const clickHandler = vi.fn()
    const { container } = render(
      <CountryListRow country={US} selectedCountry={undefined} onClick={clickHandler} style={{}} />,
    )
    screen.getByText('United States').click()
    expect(clickHandler).toHaveBeenCalledTimes(1)

    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render selected country', async () => {
    const clickHandler = vi.fn()
    const result = await act(async () => {
      return render(<CountryListRow country={US} selectedCountry={US} onClick={clickHandler} style={{}} />)
    })
    screen.getByText('United States').click()
    expect(clickHandler).toHaveBeenCalledTimes(1)

    expect(result.container.firstChild).toMatchSnapshot()
  })
})
