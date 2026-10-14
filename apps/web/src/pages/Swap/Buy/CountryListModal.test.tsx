import { CountryListModal } from '~/pages/Swap/Buy/CountryListModal'
import { US } from '~/test-utils/constants'
import { act, fireEvent, render, screen } from '~/test-utils/render'

// jsdom has no layout, so the real virtualizer measures a zero-height viewport and renders no rows.
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  UniversalList: (await import('@universe/mycelium/testing')).UniversalListTestDouble,
}))

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

    // `Modal` portals its content out of `container`, leaving `container.firstChild` null — the
    // snapshot asserted nothing. `baseElement` is the document body, so it captures the rows.
    expect(result.baseElement).toMatchSnapshot()
  })

  it('should sort countries alphabetically, with the selected country pinned to the top', () => {
    render(
      <CountryListModal
        countryList={[
          { countryCode: 'JP', displayName: 'Japan' },
          { countryCode: 'AR', displayName: 'Argentina' },
          US,
          { countryCode: 'BR', displayName: 'Brazil' },
        ]}
        isOpen={true}
        onDismiss={vi.fn()}
        onSelectCountry={vi.fn()}
        selectedCountry={US}
      />,
    )
    // Each row renders a flag image whose `alt` is the country code, in DOM order.
    const rendered = screen.getAllByLabelText('Country flag').map((flag) => flag.getAttribute('alt'))
    expect(rendered).toEqual(['US', 'AR', 'BR', 'JP'])
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
