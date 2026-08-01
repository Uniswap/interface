import {
  getMobileEarnWithdrawDestinationChainIds,
  resolveMobileEarnWithdrawDestination,
} from 'src/components/earn/earnWithdrawDestination'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const UNICHAIN_USDT0_ADDRESS = '0x9151434b16b9763660705744891fA906F660EcC5'

function getStablecoinCurrencyId(chainId: UniverseChainId, symbol: 'USDC' | 'USDT'): string {
  const token = getChainInfo(chainId).tokens[symbol]
  if (!token) {
    throw new Error(`Expected ${symbol} to be configured on chain ${chainId}`)
  }
  return buildCurrencyId(chainId, token.address)
}

describe(getMobileEarnWithdrawDestinationChainIds, () => {
  it('includes backend-supported USDT destination chains', () => {
    const chainIds = getMobileEarnWithdrawDestinationChainIds(getStablecoinCurrencyId(UniverseChainId.Mainnet, 'USDT'))

    expect(chainIds).toContain(UniverseChainId.Mainnet)
    expect(chainIds).toContain(UniverseChainId.Base)
    expect(chainIds).toContain(UniverseChainId.Unichain)
    expect(chainIds).toContain(UniverseChainId.Zksync)
    expect(chainIds).not.toContain(UniverseChainId.Blast)
  })

  it('includes Unichain for a Mainnet USDC vault', () => {
    const chainIds = getMobileEarnWithdrawDestinationChainIds(getStablecoinCurrencyId(UniverseChainId.Mainnet, 'USDC'))

    expect(chainIds).toContain(UniverseChainId.Unichain)
  })

  it.each([undefined, 'not-a-currency-id', '1-not-an-address'])(
    'returns no destinations for an unavailable vault currency',
    (currencyId) => {
      expect(getMobileEarnWithdrawDestinationChainIds(currencyId)).toEqual([])
    },
  )
})

describe(resolveMobileEarnWithdrawDestination, () => {
  const usdtVault = {
    chainId: UniverseChainId.Mainnet,
    currencyId: getStablecoinCurrencyId(UniverseChainId.Mainnet, 'USDT'),
  }
  const usdcVault = {
    chainId: UniverseChainId.Mainnet,
    currencyId: getStablecoinCurrencyId(UniverseChainId.Mainnet, 'USDC'),
  }

  it('resolves a USDT vault withdrawal to Unichain USDT0', () => {
    expect(
      resolveMobileEarnWithdrawDestination({
        vault: usdtVault,
        requestedChainId: UniverseChainId.Unichain,
      }),
    ).toEqual({
      chainId: UniverseChainId.Unichain,
      destinationCurrencyId: buildCurrencyId(UniverseChainId.Unichain, UNICHAIN_USDT0_ADDRESS),
    })
  })

  it('falls back when the requested chain supports the currency but not chained actions', () => {
    expect(
      resolveMobileEarnWithdrawDestination({
        vault: usdcVault,
        requestedChainId: UniverseChainId.Polygon,
      }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, destinationCurrencyId: usdcVault.currencyId })
  })

  it('preserves a valid chain and resolves the review destination currency', () => {
    expect(
      resolveMobileEarnWithdrawDestination({
        vault: usdcVault,
        requestedChainId: UniverseChainId.Unichain,
      }),
    ).toEqual({
      chainId: UniverseChainId.Unichain,
      destinationCurrencyId: getStablecoinCurrencyId(UniverseChainId.Unichain, 'USDC'),
    })
  })
})
