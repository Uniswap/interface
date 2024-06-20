import 'test-utils/tokens/mocks'

import { ChainId } from '@uniswap/sdk-core'
import CommonBases from 'components/SearchModal/CommonBases'
import { render } from 'test-utils/render'

const mockOnSelect = jest.fn()

describe('CommonBases', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CommonBases chainId={ChainId.MAINNET} onSelect={mockOnSelect} searchQuery="" isAddressSearch={false} />
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correct number of common bases', () => {
    const { getAllByTestId } = render(
      <CommonBases chainId={1} onSelect={mockOnSelect} searchQuery="" isAddressSearch={false} />
    )
    const items = getAllByTestId(/common-base-/)
    expect(items.length).toBe(6)
  })

  it('renders common bases on mobile', () => {
    window.innerWidth = 400
    window.dispatchEvent(new Event('resize'))
    const { getAllByTestId } = render(
      <CommonBases chainId={1} onSelect={mockOnSelect} searchQuery="" isAddressSearch={false} />
    )
    const items = getAllByTestId(/common-base-/)
    expect(items.length).toBe(6)
  })
})
