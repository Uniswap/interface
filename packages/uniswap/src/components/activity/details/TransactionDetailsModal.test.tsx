import { TransactionDetailsInfoRows } from 'uniswap/src/components/activity/details/TransactionDetailsInfoRows'
import {
  TransactionDetailsContent,
  TransactionDetailsHeader,
} from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
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

jest.mock('uniswap/src/components/menus/ContextMenuV2', () => ({
  ...jest.requireActual('uniswap/src/components/menus/ContextMenuV2.web'),
}))

const mockWalletAddress = (): Address => SAMPLE_SEED_ADDRESS_1
jest.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: jest.fn().mockReturnValue({
    evmAccount: { address: mockWalletAddress },
  }),
}))

const mockTransaction = {
  id: '9920dbad-ff24-47c8-814a-094566fc45ff',
  chainId: 81457,
  routing: 'CLASSIC',
  from: '0xee814caea14f6cccfeae34fea11d9a2ca6aabb11',
  typeInfo: {
    type: 'approve',
    tokenAddress: '0x2e8b8dafe7faa3aa2bbcd27cda50ebcdfbd8710c',
    spender: '0xf097e7bed97db1bccd9b067a564aca3d4e5da1f4',
  },
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

jest.mock('uniswap/src/features/language/localizedDayjs', () => ({
  useFormattedDateTime: jest.fn(() => 'January 1, 2023 12:00 AM'),
  FORMAT_DATE_TIME_MEDIUM: 'MMMM D, YYYY h:mm A',
}))

jest.mock('ui/src/loading/Skeleton', () => ({
  Skeleton: (): JSX.Element => <></>,
}))

describe('TransactionDetails Components', () => {
  it('renders TransactionDetailsHeader without error', () => {
    const transactionActions = [
      {
        label: 'Cancel',
        onPress: jest.fn(),
      },
    ]

    const tree = render(
      <TransactionDetailsHeader transactionActions={transactionActions} transactionDetails={mockTransaction} />,
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders TransactionDetailsContent without error', () => {
    const onClose = jest.fn()

    const tree = render(<TransactionDetailsContent transactionDetails={mockTransaction} onClose={onClose} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders TransactionDetailsInfoRows without error with isShowingMore false', () => {
    const onClose = jest.fn()

    const tree = render(
      <TransactionDetailsInfoRows isShowingMore={false} transactionDetails={mockTransaction} onClose={onClose} />,
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders TransactionDetailsInfoRows without error with isShowingMore true', () => {
    const onClose = jest.fn()

    const tree = render(
      <TransactionDetailsInfoRows isShowingMore={true} transactionDetails={mockTransaction} onClose={onClose} />,
    )

    expect(tree).toMatchSnapshot()
  })
})
