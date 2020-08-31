import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { generateAllRoutePairs } from './Trades'
import { ChainId } from '@uniswap/sdk'

describe('Trade', () => {
  const chainId = ChainId.MAINNET
  const baseTokens = BASES_TO_CHECK_TRADES_AGAINST[chainId]
  const restrictedTokens = CUSTOM_BASES[chainId]

  it('should find only restricted pairs for restricted-route tokens', () => {
    for (const restrictedToken in restrictedTokens) {
      for (const baseToken in baseTokens) {
        const tokenA = baseToken
        const tokenB = restrictedToken
        const restrictedBasesA = CUSTOM_BASES[chainId]?.[tokenA?.address] ?? []
        const restrictedBasesB = CUSTOM_BASES[chainId]?.[tokenB?.address] ?? []
        const result = generateAllRoutePairs(tokenA, tokenB, chainId)

        for (const pair of result) {
          // every pair with tokenA
          if (restrictedBasesA.length && pair.includes(tokenA)) {
            // must also contain an element from restrictedBasesA? || allbases
            expect(restrictedBasesA.map(base => pair.includes(base)).includes(true)).toBe(true)
          }
          // every pair with tokenB
          if (restrictedBasesB.length && pair.includes(tokenB)) {
            // must also contain an element from restrictedBasesB? || allbases
            expect(restrictedBasesB.map(base => pair.includes(base)).includes(true)).toBe(true)
          }
        }
      }
    }
  })
})
