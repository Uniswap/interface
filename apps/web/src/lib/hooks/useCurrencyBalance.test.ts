import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { useTokenBalances } from '~/hooks/useTokenBalances'
import { useCurrencyBalances } from '~/lib/hooks/useCurrencyBalance'
import { mocked } from '~/test-utils/mocked'
import { currencyKey } from '~/utils/currencyKey'

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ chainId: 1 }),
}))
vi.mock('wagmi', () => ({
  useReadContracts: () => ({ data: undefined, isLoading: false }),
  useBalance: () => ({ data: undefined }),
}))
vi.mock('~/hooks/useTokenBalances', () => ({
  useTokenBalances: vi.fn(),
}))

const ACCOUNT = '0x0000000000000000000000000000000000000001'
const BNB_USDT = new Token(56, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'Tether USD')

describe('useCurrencyBalances (portfolio fallback when not on the token chain)', () => {
  it('uses the exact raw balance instead of the rounded float', () => {
    mocked(useTokenBalances).mockReturnValue({
      balanceMap: {
        [currencyKey(BNB_USDT)]: { usdValue: 10, balance: 10.00448181, rawBalance: '10004481809999999999' },
      },
      balanceList: [],
      loading: false,
    })

    const { result } = renderHook(() => useCurrencyBalances(ACCOUNT, [BNB_USDT]))

    expect(result.current[0]?.quotient.toString()).toBe('10004481809999999999')
  })

  it('falls back to the float balance when no raw balance is available', () => {
    mocked(useTokenBalances).mockReturnValue({
      balanceMap: { [currencyKey(BNB_USDT)]: { usdValue: 10, balance: 10.5 } },
      balanceList: [],
      loading: false,
    })

    const { result } = renderHook(() => useCurrencyBalances(ACCOUNT, [BNB_USDT]))

    expect(result.current[0]?.toExact()).toBe('10.5')
  })

  it('falls back to the float balance when the raw balance is not a base-unit integer', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocked(useTokenBalances).mockReturnValue({
      balanceMap: { [currencyKey(BNB_USDT)]: { usdValue: 10, balance: 10.5, rawBalance: '1.5' } },
      balanceList: [],
      loading: false,
    })

    const { result } = renderHook(() => useCurrencyBalances(ACCOUNT, [BNB_USDT]))

    expect(result.current[0]?.toExact()).toBe('10.5')
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
