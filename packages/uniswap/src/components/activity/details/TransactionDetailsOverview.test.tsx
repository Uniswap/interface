import { TradingApi } from '@universe/api/src'
import { TransactionDetailsOverview } from 'uniswap/src/components/activity/details/TransactionDetailsOverview'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ETH_CURRENCY_INFO, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { render } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: vi.fn().mockReturnValue({
    evmAccount: { address: '0x82D56A352367453f74FC0dC7B071b311da373Fa6', accountType: 'signerMnemonic' },
  }),
}))

// Bypasses the accounts-store context wiring (unrelated to this test) that useIsCancelable and
// TransactionTokenContextMenu (rendered once approve content has a resolved currency) pull in.
vi.mock('uniswap/src/features/transactions/hooks/useIsCancelable', () => ({
  useIsCancelable: vi.fn().mockReturnValue(false),
}))
vi.mock('uniswap/src/components/activity/details/transactions/TransactionTokenContextMenu', () => ({
  TransactionTokenContextMenu: ({ children }: { children: React.ReactNode }): JSX.Element => <>{children}</>,
}))

vi.mock('uniswap/src/features/language/localizedDayjs', () => ({
  useFormattedDateTime: vi.fn(() => 'January 1, 2023 12:00 AM'),
  FORMAT_DATE_TIME_MEDIUM: 'MMMM D, YYYY h:mm A',
}))

// Controlled per-test via `mockCurrencyInfo`, so we can simulate a token whose metadata never resolves
// (the Revoke.cash / Permit2Approve scenario that produced the double-divider bug).
let mockCurrencyInfo: Maybe<CurrencyInfo> = ETH_CURRENCY_INFO
const { useCurrencyInfoMock } = vi.hoisted(() => ({ useCurrencyInfoMock: vi.fn() }))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: (currencyIdString: string | undefined): Maybe<CurrencyInfo> => useCurrencyInfoMock(currencyIdString),
}))

const baseTransaction: TransactionDetails = {
  id: '9920dbad-ff24-47c8-814a-094566fc45ff',
  chainId: 1,
  routing: TradingApi.Routing.CLASSIC,
  from: SAMPLE_SEED_ADDRESS_1,
  transactionOriginType: TransactionOriginType.Internal,
  typeInfo: {
    type: TransactionType.Permit2Approve,
    tokenAddress: '0x2e8b8dafe7faa3aa2bbcd27cda50ebcdfbd8710c',
    spender: '0xf097e7bed97db1bccd9b067a564aca3d4e5da1f4',
    amount: '0.0',
    dappInfo: { name: 'Revoke.cash' },
  },
  status: TransactionStatus.Success,
  addedTime: 1719911758204,
  options: { request: {} },
  hash: 'b568a9e9-bbe7-42fc-ab00-5070186c0600',
}

describe('TransactionDetailsOverview', () => {
  beforeEach(() => {
    useCurrencyInfoMock.mockImplementation((currencyIdString: string | undefined): Maybe<CurrencyInfo> => {
      if (!currencyIdString) {
        return undefined
      }
      return mockCurrencyInfo
    })
  })

  afterEach(() => {
    mockCurrencyInfo = ETH_CURRENCY_INFO
    useCurrencyInfoMock.mockReset()
  })

  it('renders only one separator above the info rows for a Permit2 approval with unresolved token metadata', () => {
    mockCurrencyInfo = undefined

    const { queryAllByTestId } = render(
      <TransactionDetailsOverview
        transactionDetails={baseTransaction}
        onClose={vi.fn()}
        openPlanView={vi.fn()}
        openCancelModal={vi.fn()}
        menuItems={[]}
      />,
    )

    expect(queryAllByTestId('transaction-details-separator')).toHaveLength(1)
  })

  it('renders two separators around visible body content for a Permit2 approval with resolved token metadata', () => {
    mockCurrencyInfo = ETH_CURRENCY_INFO

    const { queryAllByTestId } = render(
      <TransactionDetailsOverview
        transactionDetails={baseTransaction}
        onClose={vi.fn()}
        openPlanView={vi.fn()}
        openCancelModal={vi.fn()}
        menuItems={[]}
      />,
    )

    expect(queryAllByTestId('transaction-details-separator')).toHaveLength(2)
  })

  it('treats a Permit2 approval with no tokenAddress as unresolved without building a malformed currency id', () => {
    const transactionWithoutTokenAddress: TransactionDetails = {
      ...baseTransaction,
      typeInfo: {
        type: TransactionType.Permit2Approve,
        tokenAddress: undefined,
        spender: '0xf097e7bed97db1bccd9b067a564aca3d4e5da1f4',
        amount: '0.0',
        dappInfo: { name: 'Revoke.cash' },
      },
    }

    const { queryAllByTestId } = render(
      <TransactionDetailsOverview
        transactionDetails={transactionWithoutTokenAddress}
        onClose={vi.fn()}
        openPlanView={vi.fn()}
        openCancelModal={vi.fn()}
        menuItems={[]}
      />,
    )

    // Hides the redundant top separator, same as the resolved-but-empty case above.
    expect(queryAllByTestId('transaction-details-separator')).toHaveLength(1)
    // None of the currency lookups in this render tree (header logo, the empty-content guard, or the
    // approve content itself) should have built a `${chainId}-` currency id from an empty tokenAddress.
    expect(useCurrencyInfoMock.mock.calls.some(([currencyId]) => currencyId === undefined)).toBe(true)
    expect(useCurrencyInfoMock.mock.calls.some(([currencyId]) => currencyId === '1-')).toBe(false)
  })
})
