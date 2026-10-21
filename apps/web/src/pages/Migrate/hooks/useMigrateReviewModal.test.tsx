import { act, renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { DAI } from 'uniswap/src/constants/tokens'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { useMigrateReviewModal } from '~/pages/Migrate/hooks/useMigrateReviewModal'

vi.mock('~/features/Liquidity/Create/hooks/useDerivedPositionInfo', () => ({
  useDerivedPositionInfo: vi.fn(() => ({
    protocolVersion: ProtocolVersion.V4,
    currencies: { display: { TOKEN0: undefined, TOKEN1: undefined }, sdk: { TOKEN0: undefined, TOKEN1: undefined } },
    poolId: undefined,
    poolOrPairLoading: false,
    creatingPoolOrPair: false,
    refetchPoolData: vi.fn(),
  })),
}))

vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({
  useLiquidityUrlState: vi.fn(() => ({ setHistoryState: vi.fn(), syncToUrl: vi.fn() })),
}))

function renderMigrateReviewModal() {
  const setTransactionError = vi.fn()
  const utils = renderHook(
    () => ({ modal: useMigrateReviewModal({ setTransactionError }), context: useCreateLiquidityContext() }),
    {
      wrapper: ({ children }: { children?: React.ReactNode }) => (
        <CreateLiquidityContextProvider
          currencyInputs={{ tokenA: DAI, tokenB: undefined }}
          setCurrencyInputs={vi.fn()}
          initialFlowStep={PositionFlowStep.PRICE_RANGE}
        >
          {children}
        </CreateLiquidityContextProvider>
      ),
    },
  )
  return { ...utils, setTransactionError }
}

describe('useMigrateReviewModal', () => {
  it('locks the range while the migrate review modal is open', () => {
    const { result } = renderMigrateReviewModal()
    expect(result.current.context.isRangeLocked).toBe(false)

    act(() => {
      result.current.modal.openReviewModal()
    })

    expect(result.current.modal.isReviewModalOpen).toBe(true)
    expect(result.current.context.isRangeLocked).toBe(true)
  })

  it('unlocks the range and clears the transaction error when the modal closes', () => {
    const { result, setTransactionError } = renderMigrateReviewModal()

    act(() => {
      result.current.modal.openReviewModal()
    })
    act(() => {
      result.current.modal.closeReviewModal()
    })

    expect(result.current.modal.isReviewModalOpen).toBe(false)
    expect(result.current.context.isRangeLocked).toBe(false)
    expect(setTransactionError).toHaveBeenCalledWith(false)
  })
})
