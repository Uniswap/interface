import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { LP_GAS_URGENCY } from '~/features/Liquidity/constants'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { CreatePositionTxContextProvider } from '~/pages/CreatePosition/CreatePositionTxContext'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityTxContextProvider } from '~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { useRemoveLiquidityTxAndGasInfo } from '~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import { useRemoveLiquidityModalContext } from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { render, renderHook } from '~/test-utils/render'
import { PositionField } from '~/types/position'

vi.mock('uniswap/src/features/gas/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/gas/hooks')>()),
  useTransactionGasFee: vi.fn(() => ({})),
  useUSDCurrencyAmountOfGasFee: vi.fn(() => undefined),
}))
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore')
    >()),
    // The contexts under test only select these three settings; no store provider is mounted here.
    useTransactionSettingsStore: (
      selector: (state: {
        customDeadline?: number
        customSlippageTolerance?: number
        isSlippageDirty: boolean
      }) => unknown,
    ) => selector({ customDeadline: undefined, customSlippageTolerance: undefined, isSlippageDirty: false }),
  }),
)
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: () => false,
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))
// Overrides the setupTests.ts mock of this module, which stubs only useConnectionStatus.
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: () => undefined,
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfo: () => undefined,
}))
vi.mock('~/features/Liquidity/Create/hooks/useLPSlippageValues', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/hooks/useLPSlippageValues')>()),
  useDynamicNativeSlippage: () => undefined,
}))
vi.mock('~/hooks/useModalInitialState', () => ({ useModalInitialState: () => undefined }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/CreatePosition/CreateLiquidityContextProvider')>()),
  useCreateLiquidityContext: vi.fn(),
}))
vi.mock('~/pages/CreatePosition/hooks/useCreatePositionDepositInfo', () => ({
  useCreatePositionDepositInfo: () => ({}),
}))
vi.mock('~/pages/IncreaseLiquidity/IncreaseLiquidityContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/IncreaseLiquidity/IncreaseLiquidityContext')>()),
  useIncreaseLiquidityContext: vi.fn(),
}))
vi.mock('~/pages/RemoveLiquidity/RemoveLiquidityModalContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/RemoveLiquidity/RemoveLiquidityModalContext')>()),
  useRemoveLiquidityModalContext: vi.fn(),
}))
// Partial: the render wrapper's accounts store also reads `useOneClickSwapSetting` from this module.
vi.mock('~/state/oneClickSwap/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/oneClickSwap/hooks')>()),
  useSetOverrideOneClickSwapFlag: () => vi.fn(),
}))

const mockedUseTransactionGasFee = vi.mocked(useTransactionGasFee)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseIncreaseLiquidityContext = vi.mocked(useIncreaseLiquidityContext)
const mockedUseRemoveLiquidityModalContext = vi.mocked(useRemoveLiquidityModalContext)

/**
 * Guards the LP fallback-gas urgency wiring: every LP tx context must request its client-side
 * fallback estimate at LP_GAS_URGENCY. The value pin plus the per-call-site assertions make this
 * suite fail if the constant drifts off URGENT or any call site stops passing it.
 */
describe('LP fallback gas estimates are requested at LP_GAS_URGENCY', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Empty-form state: no position, no amounts. The urgency is passed unconditionally, so the
    // wiring is assertable without driving the full create/increase/remove flows.
    mockedUseCreateLiquidityContext.mockReturnValue({
      protocolVersion: undefined,
      currencies: { display: {}, sdk: {} },
      ticks: [undefined, undefined],
      poolOrPair: undefined,
      depositState: { exactField: PositionField.TOKEN0 },
      creatingPoolOrPair: false,
      poolId: undefined,
      currentTransactionStep: undefined,
      positionState: {},
      setRefetch: vi.fn(),
    } as unknown as ReturnType<typeof useCreateLiquidityContext>)

    mockedUseIncreaseLiquidityContext.mockReturnValue({
      derivedIncreaseLiquidityInfo: {},
      increaseLiquidityState: { exactField: PositionField.TOKEN0 },
      currentTransactionStep: undefined,
      preEstimatedGasFee: undefined,
    } as unknown as ReturnType<typeof useIncreaseLiquidityContext>)

    mockedUseRemoveLiquidityModalContext.mockReturnValue({
      positionInfo: undefined,
      percent: '',
      percentInvalid: true,
      currencies: undefined,
      currentTransactionStep: undefined,
      unwrapNativeCurrency: true,
    } as unknown as ReturnType<typeof useRemoveLiquidityModalContext>)
  })

  it('pins LP_GAS_URGENCY to URGENT', () => {
    expect(LP_GAS_URGENCY).toEqual({ level: Level.URGENT })
  })

  it('create position passes LP_GAS_URGENCY', () => {
    render(<CreatePositionTxContextProvider>{null}</CreatePositionTxContextProvider>)
    expect(mockedUseTransactionGasFee).toHaveBeenCalledWith(expect.objectContaining({ urgency: LP_GAS_URGENCY }))
  })

  it('increase liquidity passes LP_GAS_URGENCY', () => {
    render(<IncreaseLiquidityTxContextProvider>{null}</IncreaseLiquidityTxContextProvider>)
    expect(mockedUseTransactionGasFee).toHaveBeenCalledWith(expect.objectContaining({ urgency: LP_GAS_URGENCY }))
  })

  it('remove liquidity passes LP_GAS_URGENCY', () => {
    renderHook(() => useRemoveLiquidityTxAndGasInfo({ account: undefined }))
    expect(mockedUseTransactionGasFee).toHaveBeenCalledWith(expect.objectContaining({ urgency: LP_GAS_URGENCY }))
  })
})
