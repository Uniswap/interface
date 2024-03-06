import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'
import { ACCOUNT } from 'wallet/src/test/fixtures'
import { render } from 'wallet/src/test/test-utils'

const unitagDisplayName: DisplayName = { name: 'luni', type: DisplayNameType.Unitag }
const ensDisplayName: DisplayName = { name: 'vitalik.eth', type: DisplayNameType.ENS }
const localDisplayName: DisplayName = { name: 'Wallet 1', type: DisplayNameType.Local }
const addressDisplayName: DisplayName = { name: ACCOUNT.address, type: DisplayNameType.Address }

describe(AccountDetails, () => {
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
