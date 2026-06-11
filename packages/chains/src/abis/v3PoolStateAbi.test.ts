import IUniswapV3PoolStateJSON from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { describe, expect, it } from 'vitest'
import { v3PoolStateAbi } from './v3PoolStateAbi'

// The local const literal is the source of truth. This test
// catches drift between the two  If the upstream interface
// changes, the literal must be updated to match it.
describe('v3PoolStateAbi parity with @uniswap/v3-core JSON', () => {
  it('runtime shape matches the upstream artifact', () => {
    expect(v3PoolStateAbi).toEqual(IUniswapV3PoolStateJSON.abi)
  })
})
