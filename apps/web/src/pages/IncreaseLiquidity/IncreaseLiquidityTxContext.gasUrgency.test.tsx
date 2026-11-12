import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { LP_GAS_URGENCY } from '~/features/Liquidity/constants'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityTxContextProvider } from '~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { render } from '~/test-utils/render'
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
vi.mock('~/pages/IncreaseLiquidity/IncreaseLiquidityContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/IncreaseLiquidity/IncreaseLiquidityContext')>()),
  useIncreaseLiquidityContext: vi.fn(),
}))
// Partial: the render wrapper's accounts store also reads `useOneClickSwapSetting` from this module.
vi.mock('~/state/oneClickSwap/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/oneClickSwap/hooks')>()),
  useSetOverrideOneClickSwapFlag: () => vi.fn(),
}))

const mockedUseTransactionGasFee = vi.mocked(useTransactionGasFee)
const mockedUseIncreaseLiquidityContext = vi.mocked(useIncreaseLiquidityContext)

// The rest of the LP_GAS_URGENCY wiring guard lives in `features/Liquidity/lpGasUrgencyWiring.test.tsx`.
describe('IncreaseLiquidityTxContext fallback gas urgency', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Empty-form state: no position, no amounts. The urgency is passed unconditionally, so the
    // wiring is assertable without driving the full flow.
    mockedUseIncreaseLiquidityContext.mockReturnValue({
      derivedIncreaseLiquidityInfo: {},
      increaseLiquidityState: { exactField: PositionField.TOKEN0 },
      currentTransactionStep: undefined,
      preEstimatedGasFee: undefined,
    } as unknown as ReturnType<typeof useIncreaseLiquidityContext>)
  })

  it('increase liquidity passes LP_GAS_URGENCY', () => {
    render(<IncreaseLiquidityTxContextProvider>{null}</IncreaseLiquidityTxContextProvider>)
    expect(mockedUseTransactionGasFee).toHaveBeenCalledWith(expect.objectContaining({ urgency: LP_GAS_URGENCY }))
  })
})
