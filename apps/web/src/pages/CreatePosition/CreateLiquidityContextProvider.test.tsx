import { act, renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { type Currency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DAI, DAI_OPTIMISM, nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDerivedPositionInfo } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
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

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

const mockedUseCurrencyInfo = vi.mocked(useCurrencyInfo)
const mockedUseDerivedPositionInfo = vi.mocked(useDerivedPositionInfo)

const HOOK_ADDRESS = '0x0000000000000000000000000000000000000001'

const BNB_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
// What the token selector hands over for BNB USDT when it is built from a v2 multichain token: the
// parent's 6 decimals applied to the BNB deployment.
const MULTICHAIN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 6, 'USDT', 'Tether USD')
// What single-chain GetToken returns for the same deployment.
const GET_TOKEN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 18, 'USDT', 'Tether USD')
const BNB = nativeOnChain(UniverseChainId.Bnb)

function mockResolvedCurrencies(resolved: Currency[]): void {
  mockedUseCurrencyInfo.mockImplementation((id) => {
    const currency = resolved.find((c) => currencyId(c) === id)
    return currency ? ({ currency } as CurrencyInfo) : undefined
  })
}

function lastDerivedPositionInputs(): Parameters<typeof useDerivedPositionInfo>[0] | undefined {
  return mockedUseDerivedPositionInfo.mock.calls.at(-1)?.[0]
}

function renderProvider({ tokenA, tokenB }: { tokenA: Maybe<Currency>; tokenB?: Maybe<Currency> }) {
  let currentTokenA = tokenA
  const utils = renderHook(() => useCreateLiquidityContext(), {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <CreateLiquidityContextProvider
        currencyInputs={{ tokenA: currentTokenA, tokenB }}
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
  beforeEach(() => {
    mockedUseCurrencyInfo.mockReset()
    mockedUseDerivedPositionInfo.mockClear()
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

  it('keeps the selected hook when the token changes on the same chain', () => {
    const { result, setTokenA } = renderProvider({ tokenA: DAI })

    setTokenA(USDT)

    expect(result.current.positionState.hook).toBe(HOOK_ADDRESS)
    expect(result.current.positionState.userApprovedHook).toBe(HOOK_ADDRESS)
  })

  describe('currency resolution', () => {
    it('derives the position from the per-chain currency, not the decimals the selector handed over', () => {
      mockResolvedCurrencies([BNB, GET_TOKEN_BNB_USDT])

      renderProvider({ tokenA: BNB, tokenB: MULTICHAIN_BNB_USDT })

      expect(mockedUseCurrencyInfo).toHaveBeenCalledWith(`56-${BNB_USDT_ADDRESS}`)
      const inputs = lastDerivedPositionInputs()
      expect(inputs?.tokenA?.isNative).toBe(true)
      expect(inputs?.tokenA?.chainId).toBe(56)
      expect(inputs?.tokenB?.decimals).toBe(18)
      expect(inputs?.tokenB?.chainId).toBe(56)
      expect(inputs?.tokenB?.isToken && inputs.tokenB.address).toBe(BNB_USDT_ADDRESS)
    })

    it('withholds a selected leg from the derived position until it resolves', () => {
      mockResolvedCurrencies([BNB])

      renderProvider({ tokenA: BNB, tokenB: MULTICHAIN_BNB_USDT })

      const inputs = lastDerivedPositionInputs()
      expect(inputs?.tokenA?.isNative).toBe(true)
      expect(inputs?.tokenB).toBeUndefined()
    })

    it('never falls back to the selector currency when the lookup returns nothing', () => {
      mockResolvedCurrencies([])

      renderProvider({ tokenA: MULTICHAIN_BNB_USDT, tokenB: BNB })

      expect(lastDerivedPositionInputs()).toEqual({ tokenA: undefined, tokenB: undefined })
    })
  })
})
