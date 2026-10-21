import { Filter } from '~/components/Table/Filter'
import { render, screen } from '~/test-utils/render'

// Independent literal, deliberately not derived from MWEB_BOTTOM_INSET, so a silent change fails here.
const INSET = 'var(--mweb-bottom-inset, 0px)'

describe('Table Filter', () => {
  it('pads the mobile fixed panel by the mWeb bottom inset', () => {
    const anchor = document.createElement('div')
    document.body.appendChild(anchor)
    render(
      <Filter
        allFilters={[{ value: 'swap', label: 'Swap' }]}
        activeFilter={['swap']}
        setFilters={() => {}}
        isOpen
        toggleFilterModal={() => {}}
        anchorRef={{ current: anchor }}
      />,
    )
    // Text → FilterRow → FilterDropdown.
    const dropdown = screen.getByText('Swap').parentElement?.parentElement as HTMLElement
    expect(dropdown.classList.contains('media-md:pb-[var(--cE-pb)]')).toBe(true)
    expect(dropdown.style.getPropertyValue('--cE-pb')).toBe(`calc(8px + ${INSET})`)
    anchor.remove()
  })
})
