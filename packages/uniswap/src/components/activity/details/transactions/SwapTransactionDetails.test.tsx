import { SwapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/SwapTransactionDetails'
import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
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

jest.mock('ui/src/loading/Skeleton', () => ({
  Skeleton: (): JSX.Element => <></>,
}))

const swapTypeInfo = {
  type: 'swap',
  inputCurrencyId: '9920dbad-ff24-47c8-814a-094566fc45ff',
  outputCurrencyId: 'ee612dba-c03f-44dd-9be7-e23fec01e671',
  inputCurrencyAmountRaw: '83116',
  outputCurrencyAmountRaw: '77261',
} as SwapTypeTransactionInfo

describe('SwapTransactionDetails Component', () => {
  it('renders SwapTransactionDetails without error', () => {
    const onClose = jest.fn()

    const tree = render(<SwapTransactionDetails typeInfo={swapTypeInfo} onClose={onClose} />)

    expect(tree).toMatchSnapshot()
  })
})
