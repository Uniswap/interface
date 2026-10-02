import { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { deriveTokenFromMultichainToken } from 'uniswap/src/data/apiClients/dataApiService/tokens/utils'

const BNB_USDT = '0x55d398326f99059fF775485246999027B3197955'
const UNKNOWN_BNB_TOKEN = '0x1111111111111111111111111111111111111111'

function buildMultichainToken(decimals: number): MultichainToken {
  return new MultichainToken({
    multichainId: 'mc:1_0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals,
    addresses: {
      [String(UniverseChainId.Mainnet)]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      [String(UniverseChainId.Bnb)]: BNB_USDT,
    },
  })
}

describe('deriveTokenFromMultichainToken', () => {
  it('returns undefined when the token has no deployment on the chain', () => {
    expect(
      deriveTokenFromMultichainToken({ multichainToken: buildMultichainToken(6), chainId: UniverseChainId.Base }),
    ).toBeUndefined()
  })

  // Literal expectations on purpose: deriving them from the app's token constants would make the
  // assertion pass whatever the derivation does.
  it('uses the known per-chain decimals instead of the parent decimals for BNB USDT', () => {
    const token = deriveTokenFromMultichainToken({
      multichainToken: buildMultichainToken(6),
      chainId: UniverseChainId.Bnb,
    })

    expect(token?.address).toBe(BNB_USDT)
    expect(token?.decimals).toBe(18)
  })

  it('keeps the parent decimals on the parent chain', () => {
    expect(
      deriveTokenFromMultichainToken({ multichainToken: buildMultichainToken(6), chainId: UniverseChainId.Mainnet })
        ?.decimals,
    ).toBe(6)
  })

  it('keeps the parent decimals for a deployment the app has no known token for', () => {
    const multichainToken = buildMultichainToken(9)
    multichainToken.addresses[String(UniverseChainId.Bnb)] = UNKNOWN_BNB_TOKEN

    expect(deriveTokenFromMultichainToken({ multichainToken, chainId: UniverseChainId.Bnb })?.decimals).toBe(9)
  })
})
