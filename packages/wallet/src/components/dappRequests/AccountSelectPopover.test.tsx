import { fireEvent } from '@testing-library/react-native'
import { TestID } from '@universe/test'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures/events'
import { AccountSelectPopover } from 'wallet/src/components/dappRequests/AccountSelectPopover'
import { renderWithProviders } from 'wallet/src/test/render'

const ADDRESS_ONE = '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2'
const ADDRESS_TWO = '0xb88bc4e2b88bc4e2b88bc4e2b88bc4e2b88bc4e2'

// Stub the row content; this test only cares that the TouchableArea cloned as
// Popover.Trigger's asChild opens the content (the composition the review flagged).
vi.mock('uniswap/src/components/accounts/AddressDisplay', () => ({
  AddressDisplay: ({ address }: { address: string }): JSX.Element => <>{address}</>,
}))

vi.mock('wallet/src/components/accounts/OverlappingAccountIcons', () => ({
  OverlappingAccountIcons: (): null => null,
}))

describe('AccountSelectPopover', () => {
  it('opens the account list when the cloned TouchableArea trigger is pressed', () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <AccountSelectPopover
        allAccountAddresses={[ADDRESS_ONE, ADDRESS_TWO]}
        selectedAccountAddresses={[ADDRESS_ONE]}
        setSelectedAccountAddresses={vi.fn()}
        selectionMode="multiple"
      />,
    )

    expect(queryByText(ADDRESS_TWO)).toBeNull()

    fireEvent.press(getByTestId(TestID.SwitchAccount), ON_PRESS_EVENT_PAYLOAD)

    expect(getByText(ADDRESS_ONE)).toBeTruthy()
    expect(getByText(ADDRESS_TWO)).toBeTruthy()
  })
})
