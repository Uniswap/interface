import 'test-utils/tokens/mocks'

import CommonBases from 'components/SearchModal/CommonBases'
import { render } from 'test-utils/render'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'

const mockOnSelect = jest.fn()
const mockClose = jest.fn()

describe('CommonBases', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CommonBases
        chainId={UniverseChainId.Mainnet}
        onSelect={mockOnSelect}
        closeModal={() => {}}
        searchQuery=""
        isAddressSearch={false}
      />,
    )
    expect(container).toMatchSnapshot()
  })

  it('renders correct number of common bases', () => {
    const { getAllByTestId } = render(
      <CommonBases
        chainId={UniverseChainId.Mainnet}
        onSelect={mockOnSelect}
        closeModal={() => {}}
        searchQuery=""
        isAddressSearch={false}
      />,
    )
    const items = getAllByTestId(/common-base-/)
    expect(items.length).toBe(6)
  })

  it('renders common bases on mobile', () => {
    window.innerWidth = 400
    window.dispatchEvent(new Event('resize'))
    const { getAllByTestId } = render(
      <CommonBases
        chainId={UniverseChainId.Mainnet}
        onSelect={mockOnSelect}
        closeModal={() => {}}
        searchQuery=""
        isAddressSearch={false}
      />,
    )
    const items = getAllByTestId(/common-base-/)
    expect(items.length).toBe(6)
  })

  it('calls closeModal when active token is selected', () => {
    const { getByTestId } = render(
      <CommonBases
        chainId={UniverseChainId.Mainnet}
        onSelect={mockOnSelect}
        closeModal={mockClose}
        searchQuery=""
        isAddressSearch={false}
        selectedCurrency={USDC_MAINNET}
      />,
    )
    getByTestId(/common-base-USDC/).click()
    expect(mockClose).toHaveBeenCalled()
  })
})
