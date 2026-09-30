import { UniverseChainId } from '@universe/chains'
import { shortenAddress } from 'utilities/src/addresses'
import { TransactionReceivingSection } from 'wallet/src/components/dappRequests/TransactionReceivingSection'
import { TransactionSendingSection } from 'wallet/src/components/dappRequests/TransactionSendingSection'
import type { TransactionAsset } from 'wallet/src/features/dappRequests/types'
import { render, screen } from 'wallet/src/test/test-utils'

vi.mock('wallet/src/components/dappRequests/AssetLogo', () => ({ AssetLogo: () => null }))

const nonErcAsset: TransactionAsset = {
  type: 'NONERC',
  address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE',
  chainId: UniverseChainId.Arc,
}

describe('NONERC transfer previews', () => {
  it.each([TransactionSendingSection, TransactionReceivingSection])(
    'identifies a metadata-free asset and explicitly marks its amount unavailable',
    (Section) => {
      render(<Section assets={[nonErcAsset]} />)

      expect(screen.getByText(shortenAddress({ address: nonErcAsset.address }))).toBeTruthy()
      expect(screen.getByText('dapp.request.amountUnavailable')).toBeTruthy()
    },
  )

  it('keeps an unknown transfer visible alongside a token with metadata', () => {
    render(
      <TransactionSendingSection
        assets={[
          nonErcAsset,
          {
            type: 'ERC20',
            address: '0x3600000000000000000000000000000000000000',
            chainId: UniverseChainId.Arc,
            symbol: 'USDC',
            amount: '1',
          },
        ]}
      />,
    )

    expect(screen.getByText(shortenAddress({ address: nonErcAsset.address }))).toBeTruthy()
    expect(screen.getAllByText('dapp.request.amountUnavailable')).toHaveLength(1)
  })

  it('uses supplied NONERC metadata and a scaled amount when available', () => {
    render(<TransactionSendingSection assets={[{ ...nonErcAsset, symbol: 'TOKEN', amount: '1' }]} />)

    expect(screen.queryByText(shortenAddress({ address: nonErcAsset.address }))).toBeNull()
    expect(screen.queryByText('dapp.request.amountUnavailable')).toBeNull()
    expect(screen.getByText(/TOKEN/)).toBeTruthy()
  })
})
