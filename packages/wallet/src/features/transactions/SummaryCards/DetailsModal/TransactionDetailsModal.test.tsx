import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionDetailsInfoRows } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsInfoRows'
import {
  TransactionDetailsContent,
  TransactionDetailsHeader,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsModal'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import {
  ACCOUNT,
  ARBITRUM_DAI_CURRENCY_INFO,
  BASE_CURRENCY,
  ETH_CURRENCY_INFO,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
  currencyInfo,
  finalizedTransactionDetails,
  preloadedSharedState,
} from 'wallet/src/test/fixtures'
import { renderWithProviders } from 'wallet/src/test/render'

const preloadedState = preloadedSharedState({ account: ACCOUNT })

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
  const mockTransaction = finalizedTransactionDetails({
    status: TransactionStatus.Success,
  })
  console.log(mockTransaction)

  it('renders TransactionDetailsHeader without error', () => {
    const onClose = jest.fn()

    const { toJSON } = renderWithProviders(
      <TransactionDetailsHeader authTrigger={undefined} transactionDetails={mockTransaction} onClose={onClose} />,
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
