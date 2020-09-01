import { DAI, USDC, AMPL, BASED } from '../constants'
import { generateAllRoutePairs } from './Trades'
import { ChainId } from '@uniswap/sdk'

describe('Trade', () => {
  it('should generate proper route pairs for token pair with two route-unrestricted tokens', () => {
    const chainId = ChainId.MAINNET
    const tokenA = DAI
    const tokenB = USDC
    const result = generateAllRoutePairs(tokenA, tokenB, chainId)
    expect(result).toMatchSnapshot()
  })

  it('should generate proper route pairs for token pair with one route-unrestricted and one route-restricted token', () => {
    const chainId = ChainId.MAINNET
    const tokenA = USDC
    const tokenB = AMPL
    const result = generateAllRoutePairs(tokenA, tokenB, chainId)
    expect(result).toMatchSnapshot()
  })

  it('should generate proper route pairs for token pair with two route-restricted tokens', () => {
    const chainId = ChainId.MAINNET
    const tokenA = AMPL
    const tokenB = BASED
    const result = generateAllRoutePairs(tokenA, tokenB, chainId)
    expect(result).toMatchSnapshot()
  })
})
