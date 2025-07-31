import { Percent } from '@uniswap/sdk-core'
import { useGetPoolTokenPercentage } from 'components/Liquidity/hooks/useGetPoolTokenPercentage'
import JSBI from 'jsbi'
import { renderHook } from 'test-utils/render'

describe('useGetPoolTokenPercentage', () => {
  it('returns undefined if positionInfo is undefined', () => {
    const { result } = renderHook(() => useGetPoolTokenPercentage(undefined))
    expect(result.current).toBeUndefined()
  })

  it('returns undefined if liquidityAmount is missing', () => {
    const { result } = renderHook(() =>
      useGetPoolTokenPercentage({ totalSupply: { quotient: JSBI.BigInt(1000) } } as any),
    )
    expect(result.current).toBeUndefined()
  })

  it('returns undefined if totalSupply is missing', () => {
    const { result } = renderHook(() =>
      useGetPoolTokenPercentage({ liquidityAmount: { quotient: JSBI.BigInt(100) } } as any),
    )
    expect(result.current).toBeUndefined()
  })

  it('returns undefined if totalSupply.quotient < liquidityAmount.quotient', () => {
    const { result } = renderHook(() =>
      useGetPoolTokenPercentage({
        liquidityAmount: { quotient: JSBI.BigInt(200) },
        totalSupply: { quotient: JSBI.BigInt(100) },
      } as any),
    )
    expect(result.current).toBeUndefined()
  })

  it('returns Percent if totalSupply.quotient > liquidityAmount.quotient', () => {
    const liquidity = JSBI.BigInt(100)
    const total = JSBI.BigInt(1000)
    const { result } = renderHook(() =>
      useGetPoolTokenPercentage({
        liquidityAmount: { quotient: liquidity },
        totalSupply: { quotient: total },
      } as any),
    )
    expect(result.current).toEqual(new Percent(liquidity, total))
  })

  it('returns Percent if totalSupply.quotient === liquidityAmount.quotient', () => {
    const liquidity = JSBI.BigInt(500)
    const total = JSBI.BigInt(500)
    const { result } = renderHook(() =>
      useGetPoolTokenPercentage({
        liquidityAmount: { quotient: liquidity },
        totalSupply: { quotient: total },
      } as any),
    )
    expect(result.current).toEqual(new Percent(liquidity, total))
  })
})
