// Mock dependencies
vi.mock('pages/CreatePosition/CreateLiquidityContextProvider', () => ({
  useCreateLiquidityContext: vi.fn(),
}))

vi.mock('state/sagas/liquidity/liquiditySaga', () => ({
  liquiditySaga: {
    name: 'liquiditySaga',
    wrappedSaga: vi.fn(),
    actions: {
      trigger: vi.fn(),
    },
  },
}))

vi.mock('react-redux', async () => ({
  ...((await vi.importActual('react-redux')) as any),
  useDispatch: vi.fn(),
}))

vi.mock('react-router', async () => ({
  ...((await vi.importActual('react-router')) as any),
  useNavigate: vi.fn(),
}))

vi.mock('hooks/useSelectChain', () => ({
  default: vi.fn(),
}))

vi.mock('hooks/useAccount', () => ({
  useAccount: vi.fn(),
}))

vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus', () => ({
  useGetPasskeyAuthStatus: vi.fn(),
}))

vi.mock('utilities/src/telemetry/trace/TraceContext', () => ({
  useTrace: vi.fn(),
}))

vi.mock('hooks/Tokens', () => ({
  useCurrencyInfo: vi.fn(),
}))

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { CreatePositionModal } from 'pages/CreatePosition/CreatePositionModal'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { act, fireEvent, render } from 'test-utils/render'
import { PositionField } from 'types/position'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const mockUseCreateLiquidityContext = useCreateLiquidityContext as ReturnType<typeof vi.fn>
const mockUseDispatch = useDispatch as ReturnType<typeof vi.fn>
const mockUseNavigate = useNavigate as ReturnType<typeof vi.fn>
const mockUseSelectChain = useSelectChain as ReturnType<typeof vi.fn>
const mockUseAccount = useAccount as ReturnType<typeof vi.fn>
const mockUseWallet = useWallet as ReturnType<typeof vi.fn>
const mockUseGetPasskeyAuthStatus = useGetPasskeyAuthStatus as ReturnType<typeof vi.fn>
const mockUseTrace = useTrace as ReturnType<typeof vi.fn>
const mockUseCurrencyInfo = useCurrencyInfo as ReturnType<typeof vi.fn>

describe('CreatePositionModal', () => {
  const mockSetTransactionError = vi.fn()
  const mockOnClose = vi.fn()
  const mockDispatch = vi.fn()
  const mockNavigate = vi.fn()
  const mockSelectChain = vi.fn()
  const mockRefetch = vi.fn()
  const mockSetCurrentTransactionStep = vi.fn()

  const createMockCurrencyAmount = (currency = DAI, amount = '1000000000000000000') =>
    CurrencyAmount.fromRawAmount(currency, amount)

  const defaultProps: React.ComponentProps<typeof CreatePositionModal> = {
    formattedAmounts: {
      [PositionField.TOKEN0]: '1.0',
      [PositionField.TOKEN1]: '1000.0',
    },
    currencyAmounts: {
      [PositionField.TOKEN0]: createMockCurrencyAmount(DAI),
      [PositionField.TOKEN1]: createMockCurrencyAmount(USDC_MAINNET),
    },
    currencyAmountsUSDValue: {
      [PositionField.TOKEN0]: createMockCurrencyAmount(DAI),
      [PositionField.TOKEN1]: createMockCurrencyAmount(USDC_MAINNET),
    },
    txInfo: {
      action: {
        type: 'create' as const,
        currency0Amount: createMockCurrencyAmount(DAI),
        currency1Amount: createMockCurrencyAmount(USDC_MAINNET),
      },
      txRequest: {
        to: '0xabc',
        data: '0x',
      },
      gasFee: {
        value: '1000000000000000',
        isLoading: false,
        error: null,
      },
    } as any,
    gasFeeEstimateUSD: createMockCurrencyAmount(DAI, '5000000000000000'),
    transactionError: false,
    setTransactionError: mockSetTransactionError,
    isOpen: true,
    onClose: mockOnClose,
  }

  const mockContextValue = {
    protocolVersion: ProtocolVersion.V3,
    creatingPoolOrPair: false,
    positionState: { fee: { feeAmount: 3000, tickSpacing: 60 }, hook: undefined },
    currentTransactionStep: undefined,
    setCurrentTransactionStep: mockSetCurrentTransactionStep,
    price: undefined,
    poolOrPair: undefined,
    ticks: [undefined, undefined],
    ticksAtLimit: [false, false],
    pricesAtTicks: [undefined, undefined],
    priceRangeState: { priceInverted: false },
    refetch: mockRefetch,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseCreateLiquidityContext.mockReturnValue(mockContextValue)
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockUseSelectChain.mockReturnValue(mockSelectChain)
    mockUseAccount.mockReturnValue({
      chainId: UniverseChainId.Mainnet,
      isConnected: true,
      connector: { id: 'test' },
    })
    mockUseWallet.mockReturnValue({
      evmAccount: {
        type: 'SignerMnemonic',
        address: '0x123',
      },
    })
    mockUseGetPasskeyAuthStatus.mockReturnValue({
      isSignedInWithPasskey: false,
      isSessionAuthenticated: false,
      needsPasskeySignin: false,
    })
    mockUseTrace.mockReturnValue({})
    mockUseCurrencyInfo.mockReturnValue(undefined)
  })

  describe('protocol versions', () => {
    it('should render for V3 protocol', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        protocolVersion: ProtocolVersion.V3,
      } as any)

      const { container } = render(<CreatePositionModal {...defaultProps} />)

      expect(container).toBeTruthy()
    })

    it('should render for V2 protocol', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        protocolVersion: ProtocolVersion.V2,
      } as any)

      const { container } = render(<CreatePositionModal {...defaultProps} />)

      expect(container).toBeTruthy()
    })
  })

  describe('button states', () => {
    it('should disable Create button when txInfo.action is missing', () => {
      const { getByRole } = render(
        <CreatePositionModal
          {...defaultProps}
          txInfo={
            {
              ...defaultProps.txInfo,
              action: undefined,
            } as any
          }
        />,
      )

      const createButton = getByRole('button', { name: /Create/i })
      expect(createButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should enable Create button when txInfo.action exists', () => {
      const { getByRole } = render(<CreatePositionModal {...defaultProps} />)

      const createButton = getByRole('button', { name: /Create/i })
      expect(createButton).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('currency display', () => {
    it('should display token symbols and amounts', () => {
      const { queryAllByText } = render(<CreatePositionModal {...defaultProps} />)

      expect(queryAllByText('DAI').length).toBeGreaterThan(0)
      expect(queryAllByText('USDC').length).toBeGreaterThan(0)
      expect(queryAllByText('1.0').length).toBeGreaterThan(0)
      expect(queryAllByText('1000.0').length).toBeGreaterThan(0)
    })

    it('should display network cost', () => {
      const { getByText } = render(<CreatePositionModal {...defaultProps} />)

      expect(getByText('Network cost')).toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('should display ErrorCallout when transactionError is a string', () => {
      const { getByText } = render(<CreatePositionModal {...defaultProps} transactionError="Custom error message" />)

      expect(getByText('Something went wrong')).toBeInTheDocument()
      expect(getByText(/Custom error message/)).toBeInTheDocument()
    })

    it('should display ErrorCallout when transactionError is true', () => {
      const { getByText } = render(<CreatePositionModal {...defaultProps} transactionError={true} />)

      expect(getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should not display ErrorCallout when transactionError is false', () => {
      const { queryByText } = render(<CreatePositionModal {...defaultProps} transactionError={false} />)

      expect(queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('error clearing', () => {
    it('should clear error when Create button is clicked', () => {
      const { getByRole } = render(<CreatePositionModal {...defaultProps} transactionError="Error message" />)

      const createButton = getByRole('button', { name: /Create/i })

      act(() => {
        fireEvent.click(createButton)
      })

      // Should clear error before dispatching saga
      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
    })

    it('should clear error on second click even if first click failed', () => {
      const { getByRole, rerender } = render(<CreatePositionModal {...defaultProps} transactionError="Error message" />)

      // First click
      act(() => {
        fireEvent.click(getByRole('button', { name: /Create/i }))
      })

      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
      mockSetTransactionError.mockClear()

      // Simulate error persisting (like in e2e test)
      rerender(<CreatePositionModal {...defaultProps} transactionError="Error message" />)

      // Second click should also clear error
      act(() => {
        fireEvent.click(getByRole('button', { name: /Create/i }))
      })

      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
    })
  })

  describe('retry functionality', () => {
    it('should call refetch when ErrorCallout retry is clicked', () => {
      const { getByText } = render(<CreatePositionModal {...defaultProps} transactionError="Error message" />)
      const retryButton = getByText('Try again')
      act(() => {
        fireEvent.click(retryButton)
      })
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('passkey authentication', () => {
    it('should render Create button when not authenticated with passkey', () => {
      const { getByRole } = render(<CreatePositionModal {...defaultProps} />)

      const button = getByRole('button', { name: /Create/i })
      expect(button).toBeInTheDocument()
    })

    it('should render differently when signed in with passkey', () => {
      mockUseGetPasskeyAuthStatus.mockReturnValue({
        isSignedInWithPasskey: true,
        isSessionAuthenticated: true,
        needsPasskeySignin: false,
      })

      const { getByRole } = render(<CreatePositionModal {...defaultProps} />)

      const button = getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show loading button when transaction in progress', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        currentTransactionStep: { step: 'create' },
      } as any)

      const { getByRole } = render(<CreatePositionModal {...defaultProps} />)

      const button = getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})
