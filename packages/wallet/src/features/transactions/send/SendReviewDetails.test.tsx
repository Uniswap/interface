import type { GasFeeResult } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useIsErc20Contract } from 'wallet/src/features/contracts/hooks'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { SendReviewDetails } from 'wallet/src/features/transactions/send/SendReviewDetails'
import { renderWithProviders } from 'wallet/src/test/render'

vi.mock('react-i18next', async () => {
  const { default: sourceTranslations } = await import('uniswap/src/i18n/locales/source/en-US.json')
  const translations: Record<string, string> = sourceTranslations

  return {
    useTranslation: (): { t: (key: string) => string } => ({
      t: (key: string): string => translations[key] ?? key,
    }),
  }
})

vi.mock('wallet/src/features/transactions/contexts/SendContext', () => ({
  useSendContext: vi.fn(),
}))

vi.mock('wallet/src/features/contracts/hooks', () => ({
  useIsErc20Contract: vi.fn(),
}))

vi.mock('wallet/src/features/wallet/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/wallet/hooks')>()),
  useActiveAccountWithThrow: (): { address: string; type: AccountType } => ({
    address: '0x1111111111111111111111111111111111111111',
    type: AccountType.SignerMnemonic,
  }),
}))

vi.mock('wallet/src/features/transactions/send/hooks/useSendCallback', () => ({
  useSendERC20Callback: (): undefined => undefined,
  useSendNFTCallback: (): undefined => undefined,
}))

vi.mock(
  'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext')
    >()),
    useTransactionModalContext: (): { setScreen: () => void } => ({ setScreen: vi.fn() }),
  }),
)

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModal', () => ({
  TransactionModalFooterContainer: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: (): undefined => undefined,
}))

vi.mock('uniswap/src/features/fiatCurrency/hooks', () => ({
  useAppFiatCurrencyInfo: (): { code: string } => ({ code: 'USD' }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: (): Record<string, () => string> => ({
    formatCurrencyAmount: () => '1',
    formatNumberOrString: () => '1',
    convertFiatAmountFormatted: () => '$1',
  }),
}))

vi.mock('uniswap/src/features/transactions/TransactionDetails/TransactionDetails', () => ({
  TransactionDetails: (): null => null,
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

vi.mock('uniswap/src/components/modals/WarningModal/WarningModal', () => ({
  WarningModal: (): null => null,
}))

vi.mock('uniswap/src/features/transactions/TransactionDetails/SlippageEdit', () => ({
  SlippageEdit: (): null => null,
}))

vi.mock('uniswap/src/components/accounts/AddressDisplay', () => ({
  AddressDisplay: (): null => null,
}))

vi.mock('uniswap/src/features/accounts/AccountIcon', () => ({
  AccountIcon: (): null => null,
}))

vi.mock('uniswap/src/components/CurrencyLogo/CurrencyLogo', () => ({
  CurrencyLogo: (): null => null,
}))

// Copy is pinned as literals on purpose: reading it from the locale file would let a wording
// regression pass unnoticed.
const CONTRACT_WARNING_HEADING = 'Token address detected'
const ACKNOWLEDGEMENT = 'I understand'
const EXPECTED_FAILURE = 'Unable to estimate network fee. This transaction may fail.'

const mockUseSendContext = vi.mocked(useSendContext)
const mockUseIsErc20Contract = vi.mocked(useIsErc20Contract)

function setup({
  gasFee,
  isERC20ContractAddress = true,
}: {
  gasFee: Partial<GasFeeResult>
  isERC20ContractAddress?: boolean
}): ReturnType<typeof renderWithProviders> {
  mockUseIsErc20Contract.mockReturnValue({ isERC20ContractAddress, loading: false })
  mockUseSendContext.mockReturnValue({
    derivedSendInfo: {
      txId: 'tx-id',
      chainId: UniverseChainId.Mainnet,
      recipient: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      currencyInInfo: undefined,
      currencyAmounts: {},
      nftIn: undefined,
      exactAmountFiat: undefined,
    },
    warnings: { warnings: [], blockingWarning: undefined },
    txRequest: {},
    gasFee: { isLoading: false, error: null, ...gasFee },
    isFiatInput: false,
    fiatOffRampMetaData: undefined,
  } as never)

  return renderWithProviders(<SendReviewDetails />)
}

describe('SendReviewDetails contract-address warning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers the acknowledgement checkbox when gas is estimated', () => {
    const { getByText, queryByText } = setup({ gasFee: { value: '21000' } })

    expect(getByText(CONTRACT_WARNING_HEADING)).toBeTruthy()
    expect(getByText(ACKNOWLEDGEMENT)).toBeTruthy()
    expect(queryByText(EXPECTED_FAILURE)).toBeNull()
  })

  it('keeps the checkbox while gas is still loading', () => {
    const { getByText, queryByText } = setup({ gasFee: { isLoading: true, value: undefined } })

    expect(getByText(ACKNOWLEDGEMENT)).toBeTruthy()
    expect(queryByText(EXPECTED_FAILURE)).toBeNull()
  })

  it('replaces the checkbox with the expected-failure banner when gas resolves with no value', () => {
    const { getByText, queryByText } = setup({ gasFee: { value: undefined } })

    expect(getByText(CONTRACT_WARNING_HEADING)).toBeTruthy()
    expect(getByText(EXPECTED_FAILURE)).toBeTruthy()
    expect(queryByText(ACKNOWLEDGEMENT)).toBeNull()
  })

  it('hides the checkbox without a second banner when gas estimation errors', () => {
    const { getByText, queryByText } = setup({ gasFee: { value: undefined, error: new Error('estimate failed') } })

    expect(getByText(CONTRACT_WARNING_HEADING)).toBeTruthy()
    expect(queryByText(ACKNOWLEDGEMENT)).toBeNull()
    // TransactionDetails owns the banner for a gas error.
    expect(queryByText(EXPECTED_FAILURE)).toBeNull()
  })

  it('shows neither the warning nor the banner for a non-contract recipient', () => {
    const { queryByText } = setup({ gasFee: { value: undefined }, isERC20ContractAddress: false })

    expect(queryByText(CONTRACT_WARNING_HEADING)).toBeNull()
    expect(queryByText(ACKNOWLEDGEMENT)).toBeNull()
    expect(queryByText(EXPECTED_FAILURE)).toBeNull()
  })
})
