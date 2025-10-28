import { TransferTransactionDetails } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  ARBITRUM_DAI_CURRENCY_INFO,
  BASE_CURRENCY,
  currencyInfo,
  ETH_CURRENCY_INFO,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
  SAMPLE_SEED_ADDRESS_1,
} from 'uniswap/src/test/fixtures'
import { render } from 'uniswap/src/test/test-utils'

const mockWalletAddress = (): Address => SAMPLE_SEED_ADDRESS_1
jest.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: jest.fn().mockReturnValue({
    evmAccount: { address: mockWalletAddress },
  }),
}))

const transferTypeInfo = {
  type: 'send',
  assetType: 'currency',
  recipient: '0xcd20dfedef359abb25e0c6789eb67ffee814caea',
  tokenAddress: '0x14f6cccfeae34fea11d9a2ca6aabb112e8b8dafe',
  currencyAmountRaw: '1000000000000000000',
} as SendTokenTransactionInfo
const mockTransaction = {
  id: '9920dbad-ff24-47c8-814a-094566fc45ff',
  chainId: 81457,
  routing: 'CLASSIC',
  from: '0xee814caea14f6cccfeae34fea11d9a2ca6aabb11',
  typeInfo: transferTypeInfo,
  status: 'confirmed',
  addedTime: 1719911758204,
  options: { request: {} },
  hash: 'b568a9e9-bbe7-42fc-ab00-5070186c0600',
  receipt: {
    transactionIndex: 29529,
    blockNumber: 17489,
    blockHash: 'dfd3ad45-78e7-4124-90f2-92758b4499ba',
    confirmedTime: 1719946653408,
    gasUsed: 27844,
    effectiveGasPrice: 2941,
  },
} as TransactionDetails

// Function to set up mocks
const getCurrencyInfoForChain = (chainId: number): CurrencyInfo => {
  switch (chainId) {
    case 1: // Mainnet
      return ETH_CURRENCY_INFO
    case 42161: // Arbitrum One
      return ARBITRUM_DAI_CURRENCY_INFO
    case 8453: // Base
      return currencyInfo({ nativeCurrency: BASE_CURRENCY })
    case 10: // Optimism
      return currencyInfo({ nativeCurrency: OPTIMISM_CURRENCY })
    case 137: // Polygon
      return currencyInfo({ nativeCurrency: POLYGON_CURRENCY })
    default:
      return ETH_CURRENCY_INFO // fallback to ETH
  }
}

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useDynamicConfigValue: jest
    .fn()
    .mockImplementation(({ defaultValue }: { config: unknown; key: unknown; defaultValue: unknown }) => {
      return defaultValue
    }),
  useFeatureFlag: jest.fn().mockReturnValue(true),
  getFeatureFlag: jest.fn().mockReturnValue(true),
  useExperimentValue: jest.fn().mockReturnValue('CLASSIC'),
}))

jest.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: (currencyIdString: string | undefined): Maybe<CurrencyInfo> => {
    if (!currencyIdString) {
      return null
    }
    const [, chainIdStr] = currencyIdString.split(':')
    if (!chainIdStr) {
      return null
    }
    const chainId = parseInt(chainIdStr, 10)
    return getCurrencyInfoForChain(chainId)
  },
}))

jest.mock('ui/src/loading/Skeleton', () => ({
  Skeleton: (): JSX.Element => <></>,
}))

describe('TransferTransactionDetails Component', () => {
  it('renders TransferTransactionDetails without error', () => {
    const onClose = jest.fn()

    const tree = render(
      <TransferTransactionDetails transactionDetails={mockTransaction} typeInfo={transferTypeInfo} onClose={onClose} />,
    )

    expect(tree).toMatchSnapshot()
  })
})
