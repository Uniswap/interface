import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { act } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUserPreservedCurrencies } from '~/pages/TokenDetails/hooks/useUserPreservedCurrencies'

const ETH_USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const BASE_USDC = new Token(UniverseChainId.Base, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')
const ETH = new Token(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH')

describe('useUserPreservedCurrencies', () => {
  it('returns computed currencies when user has not interacted', () => {
    const { result } = renderHook(() => useUserPreservedCurrencies(ETH, ETH_USDC))

    expect(result.current.inputCurrency).toBe(ETH)
    expect(result.current.outputCurrency).toBe(ETH_USDC)
  })

  it('tracks updated currencies before interaction', () => {
    const { result, rerender } = renderHook(({ input, output }) => useUserPreservedCurrencies(input, output), {
      initialProps: { input: ETH, output: ETH_USDC },
    })

    expect(result.current.outputCurrency).toBe(ETH_USDC)

    rerender({ input: ETH, output: BASE_USDC })

    expect(result.current.outputCurrency).toBe(BASE_USDC)
  })

  it('freezes currencies after markInteracted is called', () => {
    const { result, rerender } = renderHook(({ input, output }) => useUserPreservedCurrencies(input, output), {
      initialProps: { input: ETH, output: ETH_USDC },
    })

    act(() => {
      result.current.markInteracted()
    })

    // Rerender with different currencies — should stay frozen
    rerender({ input: ETH, output: BASE_USDC })

    expect(result.current.inputCurrency).toBe(ETH)
    expect(result.current.outputCurrency).toBe(ETH_USDC)
  })

  it('handles undefined currencies', () => {
    const { result } = renderHook(() => useUserPreservedCurrencies(undefined, undefined))

    expect(result.current.inputCurrency).toBeUndefined()
    expect(result.current.outputCurrency).toBeUndefined()
  })

  it('freezes undefined values if interacted before currencies resolve', () => {
    const { result, rerender } = renderHook(({ input, output }) => useUserPreservedCurrencies(input, output), {
      initialProps: { input: undefined as Token | undefined, output: undefined as Token | undefined },
    })

    act(() => {
      result.current.markInteracted()
    })

    rerender({ input: ETH, output: ETH_USDC })

    expect(result.current.inputCurrency).toBeUndefined()
    expect(result.current.outputCurrency).toBeUndefined()
  })
})
