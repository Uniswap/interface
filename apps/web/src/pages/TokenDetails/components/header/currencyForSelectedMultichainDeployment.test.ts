import { Token } from '@uniswap/sdk-core'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'

/** Mainnet USDC — used as the “page” currency while selecting another deployment */
const mainnetUsdc = new Token(
  UniverseChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD Coin',
)

describe('currencyForSelectedMultichainDeployment', () => {
  it('returns the base currency when entry is undefined', () => {
    expect(currencyForSelectedMultichainDeployment(mainnetUsdc, undefined)).toBe(mainnetUsdc)
  })

  it('builds native currency for the entry chain when isNative is true', () => {
    const entry: MultichainTokenEntry = {
      chainId: UniverseChainId.Base,
      address: '0x4200000000000000000000000000000000000006',
      isNative: true,
    }
    const result = currencyForSelectedMultichainDeployment(mainnetUsdc, entry)

    expect(result.isNative).toBe(true)
    expect(result.chainId).toBe(UniverseChainId.Base)
    const { symbol, name } = getChainInfo(UniverseChainId.Base).nativeCurrency
    expect(result.symbol).toBe(symbol)
    expect(result.name).toBe(name)
  })

  it('builds an ERC-20 on the entry chain using base metadata', () => {
    const baseUsdcOnBase = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    const entry: MultichainTokenEntry = {
      chainId: UniverseChainId.Base,
      address: baseUsdcOnBase,
      isNative: false,
    }
    const result = currencyForSelectedMultichainDeployment(mainnetUsdc, entry)

    expect(result).toBeInstanceOf(Token)
    if (!(result instanceof Token)) {
      throw new Error('expected ERC-20 deployment to be a Token')
    }
    expect(result.chainId).toBe(UniverseChainId.Base)
    expect(result.decimals).toBe(mainnetUsdc.decimals)
    expect(result.symbol).toBe(mainnetUsdc.symbol)
    expect(result.name).toBe(mainnetUsdc.name)
    expect(result.address.toLowerCase()).toBe(baseUsdcOnBase.toLowerCase())
  })
})
