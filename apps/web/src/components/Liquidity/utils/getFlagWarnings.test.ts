import { getFlagsFromContractAddress, HookFlag } from 'components/Liquidity/utils/getFlagWarnings'

describe('getFlagsFromContractAddress', () => {
  it('should return an empty array for an address with no flags', () => {
    const address = '0x1234567890123456789012345678901234560000'
    expect(getFlagsFromContractAddress(address)).toEqual([])
  })

  it('should correctly identify a single flag', () => {
    const address = '0x1234567890123456789012345678901234560200'
    expect(getFlagsFromContractAddress(address)).toEqual([HookFlag.BeforeRemoveLiquidity])
  })

  it('should correctly identify multiple flags', () => {
    const address = '0x1234567890123456789012345678901234567FFF'
    expect(getFlagsFromContractAddress(address)).toEqual([
      HookFlag.BeforeRemoveLiquidity,
      HookFlag.AfterRemoveLiquidity,
      HookFlag.BeforeAddLiquidity,
      HookFlag.AfterAddLiquidity,
      HookFlag.BeforeSwap,
      HookFlag.AfterSwap,
      HookFlag.BeforeDonate,
      HookFlag.AfterDonate,
      HookFlag.BeforeSwapReturnsDelta,
      HookFlag.AfterSwapReturnsDelta,
      HookFlag.AfterAddLiquidityReturnsDelta,
      HookFlag.AfterRemoveLiquidityReturnsDelta,
    ])
  })

  it('should correctly identify a mix of flags (case 1)', () => {
    const address = '0x123456789012345678901234567890123456789A'
    expect(getFlagsFromContractAddress(address)).toEqual([
      HookFlag.BeforeAddLiquidity,
      HookFlag.BeforeSwap,
      HookFlag.AfterDonate,
      HookFlag.BeforeSwapReturnsDelta,
      HookFlag.AfterAddLiquidityReturnsDelta,
    ])
  })

  it('should correctly identify a mix of flags (case 2)', () => {
    const address = '0x12345678901234567890123456789012345678C0'
    expect(getFlagsFromContractAddress(address)).toEqual([
      HookFlag.BeforeAddLiquidity,
      HookFlag.BeforeSwap,
      HookFlag.AfterSwap,
    ])
  })

  it('should correctly identify a mix of flags (case 3)', () => {
    const address = '0x123456789012345678901234567890123456780B'
    expect(getFlagsFromContractAddress(address)).toEqual([
      HookFlag.BeforeAddLiquidity,
      HookFlag.BeforeSwapReturnsDelta,
      HookFlag.AfterAddLiquidityReturnsDelta,
      HookFlag.AfterRemoveLiquidityReturnsDelta,
    ])
  })

  it('should correctly identify a mix of flags (case 4)', () => {
    const address = '0x0000000000000000000000000000000000002400'
    expect(getFlagsFromContractAddress(address)).toEqual([HookFlag.AfterAddLiquidity])
  })
})
