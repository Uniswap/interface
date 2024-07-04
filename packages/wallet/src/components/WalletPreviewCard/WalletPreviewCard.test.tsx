import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'
import { render } from 'wallet/src/test/test-utils'

it('renders wallet preview card', () => {
  const tree = render(<WalletPreviewCard selected address={SAMPLE_SEED_ADDRESS_1} onSelect={(): null => null} />)
  expect(tree).toMatchSnapshot()
})
