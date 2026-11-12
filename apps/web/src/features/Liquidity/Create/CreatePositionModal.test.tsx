// Mock dependencies
vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', () => ({
  useCreateLiquidityContext: vi.fn(),
}))

vi.mock('~/state/sagas/liquidity/liquiditySaga', () => ({
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

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/connection/hooks/useSelectChain', () => ({
  useSelectChain: vi.fn(),
}))

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: vi.fn(),
}))

vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/hooks/useGetPasskeyAuthStatus', () => ({
  useGetPasskeyAuthStatus: vi.fn(),
}))

vi.mock('utilities/src/telemetry/trace/TraceContext', () => ({
  useTrace: vi.fn(),
}))

vi.mock('~/hooks/currency/useCurrencyInfo', () => ({ useCurrencyInfo: vi.fn() }))

// The modal reads the LP geo gate, whose compliance query resolves to undefined without a network
// layer here — react-query logs that as a console error, which the console guard fails the file on.
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({
  useLPGeoRestriction: () => ({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
  }),
}))

vi.mock('~/features/Liquidity/Create/hooks/useInitialPriceAcceptance', () => ({
  useInitialPriceAcceptance: vi.fn(() => ({ requiresAcceptance: false, acceptUpdatedPrice: vi.fn() })),
}))

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useGetPasskeyAuthStatus } from '@universe/embedded-wallet'
import { useFeatureFlag } from '@universe/gating'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { createMockEVMAccountDetails } from 'uniswap/src/test/fixtures/account'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import type { Mock } from 'vitest'
import { useAccount } from '~/connection/hooks/useAccount'
import { useSelectChain } from '~/connection/hooks/useSelectChain'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { CreatePositionModal } from '~/features/Liquidity/Create/CreatePositionModal'
import { useInitialPriceAcceptance } from '~/features/Liquidity/Create/hooks/useInitialPriceAcceptance'
import { useCurrencyInfo } from '~/hooks/currency/useCurrencyInfo'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'
import { act, fireEvent, render } from '~/test-utils/render'
import { PositionField } from '~/types/position'

const mockUseCreateLiquidityContext = useCreateLiquidityContext as Mock
const mockUseDispatch = useDispatch as Mock
const mockUseNavigate = useNavigate as Mock
const mockUseSelectChain = useSelectChain as Mock
const mockUseAccount = useAccount as Mock
const mockUseWallet = useWallet as Mock
const mockUseGetPasskeyAuthStatus = useGetPasskeyAuthStatus as Mock
const mockUseTrace = useTrace as Mock
const mockUseCurrencyInfo = useCurrencyInfo as Mock

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

  const defaultProps: React.ComponentProps<typeof Container> = {
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
    currencies: { display: { TOKEN0: DAI, TOKEN1: USDC_MAINNET }, sdk: { TOKEN0: DAI, TOKEN1: USDC_MAINNET } },
    refetch: mockRefetch,
  }

  const Container = (props: React.ComponentProps<typeof CreatePositionModal>) => {
    return (
      <LPTransactionSettingsStoreContextProvider>
        <CreatePositionModal {...props} />
      </LPTransactionSettingsStoreContextProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    window.history.replaceState({}, '', '/positions/add/new')

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
    vi.mocked(useInitialPriceAcceptance).mockReturnValue({ requiresAcceptance: false, acceptUpdatedPrice: vi.fn() })
  })

  describe('protocol versions', () => {
    it('should render for V3 protocol', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        protocolVersion: ProtocolVersion.V3,
      } as any)

      const { container } = render(<Container {...defaultProps} />)

      expect(container).toBeTruthy()
    })

    it('should render for V2 protocol', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        protocolVersion: ProtocolVersion.V2,
      } as any)

      const { container } = render(<Container {...defaultProps} />)

      expect(container).toBeTruthy()
    })
  })

  describe('hook-detail submission attribution', () => {
    const hook = '0x52908400098527886E0F7030069857D2E4169EE7'

    beforeEach(() => {
      vi.mocked(useFeatureFlag).mockReturnValue(true)
      mockUseWallet.mockReturnValue({ evmAccount: createMockEVMAccountDetails() })
      mockUseAccount.mockReturnValue({ chainId: UniverseChainId.Base, isConnected: true })
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        protocolVersion: ProtocolVersion.V4,
        positionState: { ...mockContextValue.positionState, protocolVersion: ProtocolVersion.V4, hook },
      })
    })

    const entryPoint = `/explore/hooks/ethereum/${hook}`
    const search = `?${new URLSearchParams({ entryPoint })}`

    it.each([hook, '0x1111111111111111111111111111111111111111', undefined])(
      'keeps origin attribution when the submitted hook changes to %s',
      (submittedHook) => {
        window.history.replaceState({}, '', `/positions/add/new${search}`)
        mockUseCreateLiquidityContext.mockReturnValue({
          ...mockContextValue,
          protocolVersion: ProtocolVersion.V4,
          positionState: { ...mockContextValue.positionState, hook: submittedHook },
        })
        const { getByRole } = render(<Container {...defaultProps} />)

        fireEvent.click(getByRole('button', { name: /Create/i }))

        expect(liquiditySaga.actions.trigger).toHaveBeenCalledOnce()
        const analytics = vi.mocked(liquiditySaga.actions.trigger).mock.lastCall?.[0].analytics
        expect(analytics).toMatchObject({
          came_from_hook_detail: true,
          hook: submittedHook,
          chain_id: UniverseChainId.Mainnet,
          protocol_version: ProtocolVersion.V4,
          createPosition: true,
        })
        expect(analytics).not.toHaveProperty('hook_address')
      },
    )

    it('retains the entry-point state fallback for attribution', () => {
      window.history.replaceState({ usr: { from: entryPoint } }, '', '/positions/add/new')
      const { getByRole } = render(<Container {...defaultProps} />)
      fireEvent.click(getByRole('button', { name: /Create/i }))
      expect(vi.mocked(liquiditySaga.actions.trigger).mock.lastCall?.[0].analytics).toMatchObject({
        came_from_hook_detail: true,
        hook,
      })
    })

    it.each([
      { entrySearch: '', enabled: true },
      { entrySearch: search, enabled: false },
      { entrySearch: '?entryPoint=%2Fexplore%2Fpools', enabled: true },
      { entrySearch: '?entryPoint=https%3A%2F%2Fexample.com', enabled: true },
      { entrySearch: '?source=hook_detail', enabled: true },
    ])('preserves ordinary payloads: $entrySearch, enabled=$enabled', ({ entrySearch, enabled }) => {
      vi.mocked(useFeatureFlag).mockReturnValue(enabled)
      window.history.replaceState({}, '', `/positions/add/new${entrySearch}`)
      const { getByRole } = render(<Container {...defaultProps} />)

      fireEvent.click(getByRole('button', { name: /Create/i }))

      expect(liquiditySaga.actions.trigger).toHaveBeenCalledOnce()
      const analytics = vi.mocked(liquiditySaga.actions.trigger).mock.lastCall?.[0].analytics
      expect(analytics).not.toHaveProperty('came_from_hook_detail')
      expect(analytics).not.toHaveProperty('hook_address')
      expect(analytics).toMatchObject({ hook, chain_id: UniverseChainId.Mainnet, protocol_version: ProtocolVersion.V4 })
    })
  })

  describe('button states', () => {
    it('should disable Create button when txInfo.action is missing', () => {
      const { getByRole } = render(
        <Container
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
      const { getByRole } = render(<Container {...defaultProps} />)

      const createButton = getByRole('button', { name: /Create/i })
      expect(createButton).not.toHaveAttribute('aria-disabled', 'true')
    })

    it('should disable Create button while a new pool’s moved market price awaits acceptance', () => {
      mockUseCreateLiquidityContext.mockReturnValue({ ...mockContextValue, creatingPoolOrPair: true })
      vi.mocked(useInitialPriceAcceptance).mockReturnValue({
        updatedPrice: new Price(DAI, USDC_MAINNET, '1000000000000000000', '1015000'),
        priceChangePercent: 1.5,
        requiresAcceptance: true,
        acceptUpdatedPrice: vi.fn(),
      })

      const { getByRole, getByText } = render(<Container {...defaultProps} />)

      expect(getByText('Market price updated')).toBeInTheDocument()
      expect(getByRole('button', { name: /Create/i })).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('currency display', () => {
    it('should display token symbols and amounts', () => {
      const { queryAllByText } = render(<Container {...defaultProps} />)

      expect(queryAllByText('DAI').length).toBeGreaterThan(0)
      expect(queryAllByText('USDC').length).toBeGreaterThan(0)
      expect(queryAllByText('1.0').length).toBeGreaterThan(0)
      expect(queryAllByText('1000.0').length).toBeGreaterThan(0)
    })

    it('should display network cost', () => {
      const { getByText } = render(<Container {...defaultProps} />)

      expect(getByText('Network cost')).toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('should display ErrorCallout when transactionError is a string', () => {
      const { getByText } = render(<Container {...defaultProps} transactionError="Custom error message" />)

      expect(getByText('Something went wrong')).toBeInTheDocument()
      expect(getByText(/Custom error message/)).toBeInTheDocument()
    })

    it('should display ErrorCallout when transactionError is true', () => {
      const { getByText } = render(<Container {...defaultProps} transactionError={true} />)

      expect(getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should not display ErrorCallout when transactionError is false', () => {
      const { queryByText } = render(<Container {...defaultProps} transactionError={false} />)

      expect(queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('error clearing', () => {
    it('should clear error when Create button is clicked', () => {
      const { getByRole } = render(<Container {...defaultProps} transactionError="Error message" />)

      const createButton = getByRole('button', { name: /Create/i })

      act(() => {
        fireEvent.click(createButton)
      })

      // Should clear error before dispatching saga
      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
    })

    it('should clear error on second click even if first click failed', () => {
      const { getByRole, rerender } = render(<Container {...defaultProps} transactionError="Error message" />)

      // First click
      act(() => {
        fireEvent.click(getByRole('button', { name: /Create/i }))
      })

      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
      mockSetTransactionError.mockClear()

      // Simulate error persisting (like in e2e test)
      rerender(<Container {...defaultProps} transactionError="Error message" />)

      // Second click should also clear error
      act(() => {
        fireEvent.click(getByRole('button', { name: /Create/i }))
      })

      expect(mockSetTransactionError).toHaveBeenCalledWith(false)
    })
  })

  describe('retry functionality', () => {
    it('should call refetch when ErrorCallout retry is clicked', () => {
      const { getByText } = render(<Container {...defaultProps} transactionError="Error message" />)
      const retryButton = getByText('Try again')
      act(() => {
        fireEvent.click(retryButton)
      })
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('passkey authentication', () => {
    it('should render Create button when not authenticated with passkey', () => {
      const { getByRole } = render(<Container {...defaultProps} />)

      const button = getByRole('button', { name: /Create/i })
      expect(button).toBeInTheDocument()
    })

    it('should render differently when signed in with passkey', () => {
      mockUseGetPasskeyAuthStatus.mockReturnValue({
        isSignedInWithPasskey: true,
        isSessionAuthenticated: true,
        needsPasskeySignin: false,
      })

      const { getByRole } = render(<Container {...defaultProps} />)

      const button = getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show loading button when transaction in progress', () => {
      mockUseCreateLiquidityContext.mockReturnValue({
        ...mockContextValue,
        currentTransactionStep: { step: 'create' },
      } as any)

      const { getByRole } = render(<Container {...defaultProps} />)

      const button = getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})
