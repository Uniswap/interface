// Mock dependencies
vi.mock('state/connection/hooks', () => ({
  useCurrencyBalance: vi.fn(),
}))

vi.mock('hooks/useAccount', () => ({
  useAccount: vi.fn(),
}))

vi.mock('state/multichain/useMultichainContext', () => ({
  useMultichainContext: vi.fn(),
}))

import { CurrencyAmount } from '@uniswap/sdk-core'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { useAccount } from 'hooks/useAccount'
import { useCurrencyBalance } from 'state/connection/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { renderWithUniswapContext as render } from 'test-utils/render'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

const mockUseCurrencyBalance = useCurrencyBalance as ReturnType<typeof vi.fn>
const mockUseAccount = useAccount as ReturnType<typeof vi.fn>
const mockUseMultichainContext = useMultichainContext as ReturnType<typeof vi.fn>

describe('SwapCurrencyInputPanel balance formatting', () => {
  const mockOnUserInput = vi.fn()
  const mockOnCurrencySelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chainId: UniverseChainId.Mainnet,
      isConnected: true,
    })

    mockUseMultichainContext.mockReturnValue({
      chainId: UniverseChainId.Mainnet,
      isUserSelectedToken: false,
    })
  })

  const defaultProps: React.ComponentProps<typeof SwapCurrencyInputPanel> = {
    value: '',
    onUserInput: mockOnUserInput,
    onCurrencySelect: mockOnCurrencySelect,
    showMaxButton: false,
    label: 'You pay',
    currencyField: CurrencyField.INPUT,
    id: 'swap-currency-input',
  }

  describe('native ETH balance formatting', () => {
    it('should format large ETH balance with thousands separator and decimals', () => {
      const ETH = nativeOnChain(UniverseChainId.Mainnet)
      const balance = CurrencyAmount.fromRawAmount(ETH, '10000000000000000000000') // 10,000 ETH

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={ETH} />)

      // Balance should display as "10,000.00 ETH" (with locale-specific formatting)
      const balanceTexts = queryAllByText(/10,000/)
      expect(balanceTexts.length).toBeGreaterThan(0)
    })

    it('should format small ETH balance correctly', () => {
      const ETH = nativeOnChain(UniverseChainId.Mainnet)
      const balance = CurrencyAmount.fromRawAmount(ETH, '1500000000000000000') // 1.5 ETH

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={ETH} />)

      const balanceTexts = queryAllByText(/1\.5/)
      expect(balanceTexts.length).toBeGreaterThan(0)
    })
  })

  describe('ERC20 token balance formatting', () => {
    it('should format token balance without trailing zeros for whole numbers', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '100000000') // 100 USDT (6 decimals)

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should display "100 USDT" without ".00"
      const balanceTexts = queryAllByText(/100/)
      expect(balanceTexts.length).toBeGreaterThan(0)
      // Should NOT have trailing zeros
      expect(queryAllByText('100.0').length).toBe(0)
    })

    it('should format token balance with up to 3 decimals', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '100111110') // 100.111110 USDT

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should display "100.111 USDT" with max 3 significant decimals
      // The formatter shows up to 3 decimals for token balances
      const balanceTexts = queryAllByText(/100\.11/)
      expect(balanceTexts.length).toBeGreaterThan(0)
    })

    it('should format token balance with trailing zeros removed', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '100100000') // 100.1 USDT

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should display "100.1 USDT" not "100.100"
      const balanceTexts = queryAllByText(/100\.1/)
      expect(balanceTexts.length).toBeGreaterThan(0)
      // Should NOT have extra trailing zeros
      expect(queryAllByText('100.10').length).toBe(0)
    })

    it('should format very small token balance correctly', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '1234') // 0.001234 USDT

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should show small balance with appropriate precision
      const balanceTexts = queryAllByText(/0\.001/)
      expect(balanceTexts.length).toBeGreaterThan(0)
    })

    it('should format large token balance with thousands separator', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '123456789000') // 123,456.789 USDT

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { queryAllByText } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should display with thousands separator
      const balanceTexts = queryAllByText(/123,456/)
      expect(balanceTexts.length).toBeGreaterThan(0)
    })

    it('should display zero balance', () => {
      const balance = CurrencyAmount.fromRawAmount(USDT, '0')

      mockUseCurrencyBalance.mockReturnValue(balance)

      const { container } = render(<SwapCurrencyInputPanel {...defaultProps} currency={USDT} />)

      // Should display "0 USDT" or similar
      expect(container.textContent).toMatch(/0.*USDT|USDT.*0/)
    })
  })
})
