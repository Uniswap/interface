import { act, renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { DAI, DAI_OPTIMISM, USDT } from 'uniswap/src/constants/tokens'
import { describe, expect, it, vi } from 'vitest'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'

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

vi.mock('~/features/fees/useServedProtocolFees', () => ({
  useServedProtocolFee: vi.fn(() => undefined),
}))

const HOOK_ADDRESS = '0x0000000000000000000000000000000000000001'

function renderProvider({ tokenA }: { tokenA: Maybe<Currency> }) {
  let currentTokenA = tokenA
  const utils = renderHook(() => useCreateLiquidityContext(), {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <CreateLiquidityContextProvider
        currencyInputs={{ tokenA: currentTokenA, tokenB: undefined }}
        setCurrencyInputs={vi.fn()}
        initialPositionState={{ hook: HOOK_ADDRESS, userApprovedHook: HOOK_ADDRESS }}
        initialFlowStep={PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER}
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
  }
}

describe('CreateLiquidityContextProvider', () => {
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

  it('keeps the selected hook when the token changes on the same chain', () => {
    const { result, setTokenA } = renderProvider({ tokenA: DAI })

    setTokenA(USDT)

    expect(result.current.positionState.hook).toBe(HOOK_ADDRESS)
    expect(result.current.positionState.userApprovedHook).toBe(HOOK_ADDRESS)
  })
})
