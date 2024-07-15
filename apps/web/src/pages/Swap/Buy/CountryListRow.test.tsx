import { CountryListRow } from 'pages/Swap/Buy/CountryListRow'
import { US } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

describe('CountryListRow', () => {
  it('should render', () => {
    const clickHandler = jest.fn()
    const { container } = render(
      <CountryListRow country={US} selectedCountry={undefined} onClick={clickHandler} style={{}} />,
    )
    screen.getByText('United States').click()
    expect(clickHandler).toHaveBeenCalledTimes(1)

    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render selected country', () => {
    const clickHandler = jest.fn()
    const { container } = render(<CountryListRow country={US} selectedCountry={US} onClick={clickHandler} style={{}} />)
    screen.getByText('United States').click()
    expect(clickHandler).toHaveBeenCalledTimes(1)

    expect(container.firstChild).toMatchSnapshot()
  })
})
