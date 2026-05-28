import { NFTMintTransactionInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NftTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/NftTransactionDetails'
import { ACCOUNT, preloadedWalletPackageState } from 'wallet/src/test/fixtures'
import { render } from 'wallet/src/test/test-utils'

const preloadedState = preloadedWalletPackageState({ account: ACCOUNT })
const nftTypeInfo = {
  type: 'nft-mint',
  nftSummaryInfo: {
    tokenId: '9920dbad-ff24-47c8-814a-094566fc45ff',
    name: 'voluptates repudiandae aliquid',
    collectionName: 'inventore qui fugiat',
    imageURL: 'https://loremflickr.com/640/480',
    address: '0xaea14f6cccfeae34fea11d9a2ca6aabb112e8b8d',
  },
} as NFTMintTransactionInfo
const mockTransaction = {
  id: '9920dbad-ff24-47c8-814a-094566fc45ff',
  chainId: 81457,
  routing: 'CLASSIC',
  from: '0xee814caea14f6cccfeae34fea11d9a2ca6aabb11',
  typeInfo: nftTypeInfo,
  status: 'confirmed',
  addedTime: 1719911758204,
  options: { request: {} },
  hash: 'b568a9e9-bbe7-42fc-ab00-5070186c0600',
  receipt: {
    transactionIndex: 29529,
    blockNumber: 17489,
    blockHash: 'dfd3ad45-78e7-4124-90f2-92758b4499ba',
    confirmedTime: 1719946653408,
    confirmations: 57408,
    gasUsed: 27844,
    effectiveGasPrice: 2941,
  },
} as TransactionDetails

// Mock the ImageUri component
jest.mock('wallet/src/features/images/ImageUri', () => ({
  ImageUri: jest.fn(() => null),
}))

describe('NftTransactionDetails Component', () => {
  it('renders NftTransactionDetails without error', () => {
    const onClose = jest.fn()

    const tree = render(
      <NftTransactionDetails transactionDetails={mockTransaction} typeInfo={nftTypeInfo} onClose={onClose} />,
      {
        preloadedState,
      },
    )

    expect(tree).toMatchSnapshot()
  })
})
