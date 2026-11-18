import { act, renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { FeeAmount, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { DAI, DAI_OPTIMISM, nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { type TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useDerivedPositionInfo } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { type CreatePositionInfo, PositionFlowStep } from '~/features/Liquidity/Create/types'
import { getPriceRangeInfo } from '~/features/Liquidity/utils/priceRangeInfo'

vi.mock('~/features/Liquidity/Create/hooks/useDerivedPositionInfo', () => ({
  useDerivedPositionInfo: vi.fn(() => ({
    protocolVersion: ProtocolVersion.V4,
    currencies: {
      display: { TOKEN0: undefined, TOKEN1: undefined },
      sdk: { TOKEN0: undefined, TOKEN1: undefined },
    },
    poolId: undefined,
    poolOrPairLoading: false,
    creatingPoolOrPair: false,
    refetchPoolData: vi.fn(),
  })),
}))

vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({
  useLiquidityUrlState: vi.fn(() => ({
    setHistoryState: vi.fn(),
    syncToUrl: vi.fn(),
  })),
}))

vi.mock('~/features/Liquidity/utils/priceRangeInfo', () => ({
  getPriceRangeInfo: vi.fn(() => undefined),
}))

const mockedUseDerivedPositionInfo = vi.mocked(useDerivedPositionInfo)
const mockedGetPriceRangeInfo = vi.mocked(getPriceRangeInfo)

const HOOK_ADDRESS = '0x0000000000000000000000000000000000000001'

function renderProvider({
  tokenA,
  flowStep = PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
  onStepChange,
  priceInverted,
}: {
  tokenA: Maybe<Currency>
  flowStep?: PositionFlowStep
  onStepChange?: (step: PositionFlowStep | null) => void
  priceInverted?: boolean
}) {
  let currentTokenA = tokenA
  let currentFlowStep = flowStep
  let currentPriceInverted = priceInverted
  const utils = renderHook(() => useCreateLiquidityContext(), {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <CreateLiquidityContextProvider
        currencyInputs={{ tokenA: currentTokenA, tokenB: undefined }}
        setCurrencyInputs={vi.fn()}
        initialPositionState={{ hook: HOOK_ADDRESS, userApprovedHook: HOOK_ADDRESS }}
        initialFlowStep={currentFlowStep}
        onStepChange={onStepChange}
        priceInverted={currentPriceInverted}
      >
        {children}
      </CreateLiquidityContextProvider>
    ),
  })
  return {
    ...utils,
    setTokenA: (newTokenA: Maybe<Currency>) => {
      currentTokenA = newTokenA
      utils.rerender()
    },
    setFlowStep: (newFlowStep: PositionFlowStep) => {
      currentFlowStep = newFlowStep
      utils.rerender()
    },
    setPriceInverted: (newPriceInverted: boolean) => {
      currentPriceInverted = newPriceInverted
      utils.rerender()
    },
  }
}

describe('CreateLiquidityContextProvider', () => {
  it('follows a host-held price orientation, carrying the range over', () => {
    const { result, setPriceInverted } = renderProvider({ tokenA: DAI, priceInverted: false })
    act(() => {
      result.current.setPriceRangeState((prev) => ({ ...prev, minTick: -120, maxTick: 60 }))
    })

    setPriceInverted(true)

    expect(result.current.priceRangeState).toMatchObject({ priceInverted: true, minTick: -60, maxTick: 120 })
  })

  it('starts in the host-held price orientation', () => {
    const { result } = renderProvider({ tokenA: DAI, priceInverted: true })
    expect(result.current.priceRangeState.priceInverted).toBe(true)
  })

  it('clears the selected hook when the token chain changes', () => {
    const { result, setTokenA } = renderProvider({ tokenA: DAI })

    act(() => {
      result.current.setSelectedHookEntry(new HookEntry({ address: HOOK_ADDRESS, chainId: DAI.chainId }))
    })
    expect(result.current.positionState.hook).toBe(HOOK_ADDRESS)
    expect(result.current.selectedHookEntry).toBeDefined()

    setTokenA(DAI_OPTIMISM)

    expect(result.current.positionState.hook).toBeUndefined()
    expect(result.current.positionState.userApprovedHook).toBeUndefined()
    expect(result.current.selectedHookEntry).toBeUndefined()
  })

  it('sends step changes to onStepChange instead of the URL when given', () => {
    const setHistoryState = vi.fn()
    vi.mocked(useLiquidityUrlState).mockReturnValue({ setHistoryState, syncToUrl: vi.fn() } as unknown as ReturnType<
      typeof useLiquidityUrlState
    >)
    const onStepChange = vi.fn()
    const { result } = renderProvider({ tokenA: DAI, onStepChange })

    act(() => {
      result.current.setStep(PositionFlowStep.DEPOSIT)
    })
    act(() => {
      result.current.reset()
    })

    expect(onStepChange).toHaveBeenNthCalledWith(1, PositionFlowStep.DEPOSIT)
    expect(onStepChange).toHaveBeenNthCalledWith(2, PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
    expect(setHistoryState).not.toHaveBeenCalled()
  })

  it('writes step changes to the URL by default', () => {
    const setHistoryState = vi.fn()
    vi.mocked(useLiquidityUrlState).mockReturnValue({ setHistoryState, syncToUrl: vi.fn() } as unknown as ReturnType<
      typeof useLiquidityUrlState
    >)
    const { result } = renderProvider({ tokenA: DAI })

    act(() => {
      result.current.setStep(PositionFlowStep.DEPOSIT)
    })
    act(() => {
      result.current.reset()
    })

    expect(setHistoryState).toHaveBeenNthCalledWith(1, PositionFlowStep.DEPOSIT)
    expect(setHistoryState).toHaveBeenNthCalledWith(2, PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  })

  it('keeps the selected hook when the token changes on the same chain', () => {
    const { result, setTokenA } = renderProvider({ tokenA: DAI })

    setTokenA(USDT)

    expect(result.current.positionState.hook).toBe(HOOK_ADDRESS)
    expect(result.current.positionState.userApprovedHook).toBe(HOOK_ADDRESS)
  })

  describe('a preset range on an existing pool', () => {
    // WETH/USDT 0.3% (tick spacing 60). STABLE spans the current tick's 60-tick bucket ± 3 spacings.
    // Tick literals are deliberately not derived from calculateStrategyTicks.
    const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
    const POOL_TICK = -193981 // bucket [-194040, -193980)
    const PRESET_AT_EARLIER_TICK = { minTick: -194280, maxTick: -193920 } // STABLE when the bucket was -194100

    function mockPoolAtTick(tick: number, { creatingPoolOrPair = false } = {}): void {
      mockedUseDerivedPositionInfo.mockReturnValue({
        protocolVersion: ProtocolVersion.V3,
        currencies: { display: { TOKEN0: WETH, TOKEN1: USDT }, sdk: { TOKEN0: WETH, TOKEN1: USDT } },
        pool: new V3Pool(WETH, USDT, FeeAmount.MEDIUM, TickMath.getSqrtRatioAtTick(tick), '1000000', tick),
        poolId: undefined,
        poolOrPairLoading: false,
        creatingPoolOrPair,
        refetchPoolData: vi.fn(),
      } as CreatePositionInfo)
    }

    function lastPriceRangeTicks(): { minTick?: number; maxTick?: number } {
      const state = mockedGetPriceRangeInfo.mock.calls.at(-1)?.[0].state
      return { minTick: state?.minTick, maxTick: state?.maxTick }
    }

    beforeEach(() => {
      mockedGetPriceRangeInfo.mockClear()
    })

    it('re-derives an untouched preset from the polled tick in the same render', () => {
      mockPoolAtTick(POOL_TICK)
      const { result } = renderProvider({ tokenA: WETH })

      act(() => {
        result.current.setPriceRangeState((prev) => ({
          ...prev,
          ...PRESET_AT_EARLIER_TICK,
          followedPreset: { strategy: DefaultPriceStrategy.STABLE, ...PRESET_AT_EARLIER_TICK },
        }))
      })

      expect(lastPriceRangeTicks()).toEqual({ minTick: -194220, maxTick: -193860 })
    })

    it('keeps a range the user edited after picking the preset', () => {
      mockPoolAtTick(POOL_TICK)
      const { result } = renderProvider({ tokenA: WETH })

      act(() => {
        result.current.setPriceRangeState((prev) => ({
          ...prev,
          minTick: PRESET_AT_EARLIER_TICK.minTick,
          maxTick: -193860, // max nudged up after the preset wrote -193920
          followedPreset: { strategy: DefaultPriceStrategy.STABLE, ...PRESET_AT_EARLIER_TICK },
        }))
      })

      expect(lastPriceRangeTicks()).toEqual({ minTick: -194280, maxTick: -193860 })
    })

    it('holds the range once a transaction is in flight', () => {
      mockPoolAtTick(POOL_TICK)
      const { result } = renderProvider({ tokenA: WETH })

      act(() => {
        result.current.setCurrentTransactionStep({
          step: { type: TransactionStepType.IncreasePositionTransaction } as TransactionStep,
          accepted: true,
        })
        result.current.setPriceRangeState((prev) => ({
          ...prev,
          ...PRESET_AT_EARLIER_TICK,
          followedPreset: { strategy: DefaultPriceStrategy.STABLE, ...PRESET_AT_EARLIER_TICK },
        }))
      })

      expect(lastPriceRangeTicks()).toEqual(PRESET_AT_EARLIER_TICK)
    })

    it('holds the range while the review modal is open and catches up when it closes', () => {
      mockPoolAtTick(POOL_TICK)
      const { result } = renderProvider({ tokenA: WETH })

      act(() => {
        result.current.setIsReviewModalOpen(true)
        result.current.setPriceRangeState((prev) => ({
          ...prev,
          ...PRESET_AT_EARLIER_TICK,
          followedPreset: { strategy: DefaultPriceStrategy.STABLE, ...PRESET_AT_EARLIER_TICK },
        }))
      })
      expect(result.current.isRangeLocked).toBe(true)
      expect(lastPriceRangeTicks()).toEqual(PRESET_AT_EARLIER_TICK)

      act(() => {
        result.current.setIsReviewModalOpen(false)
      })
      expect(result.current.isRangeLocked).toBe(false)
      expect(lastPriceRangeTicks()).toEqual({ minTick: -194220, maxTick: -193860 })
    })

    it('closes the review modal and unlocks the range when the step changes under it', () => {
      // Browser back off the deposit step unmounts the modal without calling its onClose.
      mockPoolAtTick(POOL_TICK)
      const { result, setFlowStep } = renderProvider({ tokenA: WETH, flowStep: PositionFlowStep.DEPOSIT })

      act(() => {
        result.current.setIsReviewModalOpen(true)
      })
      expect(result.current.isRangeLocked).toBe(true)

      setFlowStep(PositionFlowStep.PRICE_RANGE)
      expect(result.current.isReviewModalOpen).toBe(false)
      expect(result.current.isRangeLocked).toBe(false)

      // Returning to the deposit step must not reopen it.
      setFlowStep(PositionFlowStep.DEPOSIT)
      expect(result.current.isReviewModalOpen).toBe(false)
    })

    it('closes the review modal on reset', () => {
      mockPoolAtTick(POOL_TICK)
      const { result } = renderProvider({ tokenA: WETH, flowStep: PositionFlowStep.DEPOSIT })

      act(() => {
        result.current.setIsReviewModalOpen(true)
      })
      act(() => {
        result.current.reset()
      })

      expect(result.current.isReviewModalOpen).toBe(false)
    })

    it('keeps the range while creating a pool, whose tick follows the typed price instead', () => {
      mockPoolAtTick(POOL_TICK, { creatingPoolOrPair: true })
      const { result } = renderProvider({ tokenA: WETH })

      act(() => {
        result.current.setPriceRangeState((prev) => ({
          ...prev,
          ...PRESET_AT_EARLIER_TICK,
          followedPreset: { strategy: DefaultPriceStrategy.STABLE, ...PRESET_AT_EARLIER_TICK },
        }))
      })

      expect(lastPriceRangeTicks()).toEqual(PRESET_AT_EARLIER_TICK)
    })
  })
})
