import { renderHook } from '@testing-library/react-native'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useHasSufficientFunds } from 'src/components/Requests/RequestModal/hooks'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ defaultChainId: UniverseChainId.Mainnet }),
}))

vi.mock('uniswap/src/features/portfolio/api', () => ({
  useOnChainCurrencyBalance: vi.fn(),
}))

describe(useHasSufficientFunds, () => {
  it.each([
    {
      name: 'covers a 1 USDC native payment with 12.2213 USDC on Arc',
      chainId: UniverseChainId.Arc,
      balance: '12221300',
      value: '1000000000000000000',
      expected: true,
    },
    {
      name: 'accepts a hex native value on Arc',
      chainId: UniverseChainId.Arc,
      balance: '12221300',
      value: '0xde0b6b3a7640000',
      expected: true,
    },
    {
      name: 'requires enough Arc USDC for both the payment and gas',
      chainId: UniverseChainId.Arc,
      balance: '1000000',
      value: '1000000000000000000',
      expected: false,
    },
    {
      name: 'accepts an exact balance for the Arc payment and gas',
      chainId: UniverseChainId.Arc,
      balance: '1001000',
      value: '1000000000000000000',
      expected: true,
    },
    {
      name: 'rounds up native value below one Arc USDC base unit',
      chainId: UniverseChainId.Arc,
      balance: '1001000',
      value: '1000000000000000001',
      expected: false,
    },
    {
      name: 'checks only gas when native value is absent',
      chainId: UniverseChainId.Arc,
      balance: '1000',
      value: undefined,
      expected: true,
    },
    {
      name: 'preserves native ETH units on Ethereum',
      chainId: UniverseChainId.Mainnet,
      balance: '1000000000000000000',
      value: '1000000000000000000',
      expected: false,
    },
    {
      name: 'requires the native payment balance even when gas is sponsored',
      chainId: UniverseChainId.Mainnet,
      balance: '10000000000000000',
      value: '1000000000000000000',
      gasFee: '0',
      expected: false,
    },
    {
      name: 'accepts an exact payment balance when gas is sponsored',
      chainId: UniverseChainId.Mainnet,
      balance: '1000000000000000000',
      value: '1000000000000000000',
      gasFee: '0',
      expected: true,
    },
    {
      name: 'allows a zero-value first call when gas is sponsored',
      chainId: UniverseChainId.Mainnet,
      balance: '10000000000000000',
      value: '0',
      gasFee: '0',
      expected: true,
    },
    {
      name: 'covers gas for a zero-value Tempo transaction',
      chainId: UniverseChainId.Tempo,
      balance: '1000',
      value: '0',
      expected: true,
    },
    {
      name: 'requires enough pathUSD for a zero-value Tempo transaction',
      chainId: UniverseChainId.Tempo,
      balance: '999',
      value: '0',
      expected: false,
    },
  ])('$name', ({ chainId, balance, value, gasFee = '1000000000000000', expected }) => {
    vi.mocked(useOnChainCurrencyBalance).mockReturnValue({
      balance: CurrencyAmount.fromRawAmount(getChainGasToken(chainId), balance),
      isLoading: false,
      error: undefined,
    })

    const { result } = renderHook(() =>
      useHasSufficientFunds({
        account: '0x1234567890123456789012345678901234567890',
        chainId,
        value,
        gasFee: { value: gasFee, isLoading: false, error: null },
      }),
    )

    expect(result.current).toBe(expected)
  })
})
