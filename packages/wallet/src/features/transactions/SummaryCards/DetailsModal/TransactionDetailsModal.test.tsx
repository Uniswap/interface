import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionDetailsInfoRows } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsInfoRows'
import {
  TransactionDetailsContent,
  TransactionDetailsHeader,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsModal'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import {
  ACCOUNT,
  ARBITRUM_DAI_CURRENCY_INFO,
  BASE_CURRENCY,
  ETH_CURRENCY_INFO,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
  currencyInfo,
  preloadedSharedState,
} from 'wallet/src/test/fixtures'
import { renderWithProviders } from 'wallet/src/test/render'

const preloadedState = preloadedSharedState({ account: ACCOUNT })
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
    confirmations: 57408,
    gasUsed: 27844,
    effectiveGasPrice: 2941,
  },
} as TransactionDetails

// Helper function to get currency info based on chain ID
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

// Mock useCurrencyInfo
jest.mock('wallet/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: (currencyId: string | undefined): Maybe<CurrencyInfo> => {
    if (!currencyId) {
      return null
    }
    const [, chainIdStr] = currencyId.split(':')
    if (!chainIdStr) {
      return null
    }
    const chainId = parseInt(chainIdStr, 10)
    return getCurrencyInfoForChain(chainId)
  },
}))

jest.mock('wallet/src/features/language/localizedDayjs', () => ({
  useFormattedDateTime: jest.fn(() => 'January 1, 2023 12:00 AM'),
  FORMAT_DATE_TIME_MEDIUM: 'MMMM D, YYYY h:mm A',
}))

describe('TransactionDetails Components', () => {
  it('renders TransactionDetailsHeader without error', () => {
    const transactionActions = {
      openActionsModal: jest.fn(),
      openCancelModal: jest.fn(),
      renderModals: jest.fn(),
      menuItems: [],
    }

    const { toJSON } = renderWithProviders(
      <TransactionDetailsHeader transactionActions={transactionActions} transactionDetails={mockTransaction} />,
      { preloadedState },
    )

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders TransactionDetailsContent without error', () => {
    const onClose = jest.fn()

    const { toJSON } = renderWithProviders(
      <TransactionDetailsContent transactionDetails={mockTransaction} onClose={onClose} />,
      {
        preloadedState,
      },
    )

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders TransactionDetailsInfoRows without error', () => {
    const { toJSON } = renderWithProviders(<TransactionDetailsInfoRows transactionDetails={mockTransaction} />, {
      preloadedState,
    })

    expect(toJSON()).toMatchSnapshot()
  })
})
