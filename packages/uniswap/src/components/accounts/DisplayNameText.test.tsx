import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { render } from 'uniswap/src/test/test-utils'

const unitagDisplayName: DisplayName = { name: 'luni', type: DisplayNameType.Unitag }
const ensDisplayName: DisplayName = { name: 'vitalik.eth', type: DisplayNameType.ENS }
const localDisplayName: DisplayName = { name: 'Wallet 1', type: DisplayNameType.Local }
const addressDisplayName: DisplayName = {
  name: SAMPLE_SEED_ADDRESS_1,
  type: DisplayNameType.Address,
}

describe(DisplayNameText, () => {
  it('renders unitag without error', () => {
    const tree = render(<DisplayNameText displayName={unitagDisplayName} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders ens display name without error', () => {
    const tree = render(<DisplayNameText displayName={ensDisplayName} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders local display name without error', () => {
    const tree = render(<DisplayNameText displayName={localDisplayName} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders address display name without error', () => {
    const tree = render(<DisplayNameText displayName={addressDisplayName} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
