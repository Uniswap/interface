import { toPlainMessage } from '@bufbuild/protobuf'
import { ChainDeployment, MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { deriveTokenFromMultichainToken } from 'uniswap/src/data/apiClients/dataApiService/tokens/utils'
import { type DataApiMultichainToken } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'

const MAINNET_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const BNB_USDT = '0x55d398326f99059fF775485246999027B3197955'

function buildMultichainToken({ bnbDecimals }: { bnbDecimals: number }): MultichainToken {
  return new MultichainToken({
    multichainId: `mc:1_${MAINNET_USDT}`,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    addresses: {
      [String(UniverseChainId.Mainnet)]: MAINNET_USDT,
      [String(UniverseChainId.Bnb)]: BNB_USDT,
    },
    deployments: {
      [String(UniverseChainId.Mainnet)]: new ChainDeployment({ address: MAINNET_USDT, decimals: 6 }),
      [String(UniverseChainId.Bnb)]: new ChainDeployment({ address: BNB_USDT, decimals: bnbDecimals }),
    },
  })
}

/** The shape persisted by clients before data-api served `deployments`: the key is absent, not empty. */
function buildPersistedRowWithoutDeployments(): DataApiMultichainToken {
  const { deployments: _omitted, ...row } = toPlainMessage(buildMultichainToken({ bnbDecimals: 18 }))
  return row
}

describe('deriveTokenFromMultichainToken', () => {
  it('returns undefined when the token has no deployment on the chain', () => {
    expect(
      deriveTokenFromMultichainToken({
        multichainToken: buildMultichainToken({ bnbDecimals: 18 }),
        chainId: UniverseChainId.Base,
      }),
    ).toBeUndefined()
  })

  it("uses the deployment's own decimals instead of the parent decimals", () => {
    const token = deriveTokenFromMultichainToken({
      multichainToken: buildMultichainToken({ bnbDecimals: 18 }),
      chainId: UniverseChainId.Bnb,
    })

    expect(token?.address).toBe(BNB_USDT)
    expect(token?.decimals).toBe(18)
  })

  it('keeps the parent decimals on the parent chain', () => {
    expect(
      deriveTokenFromMultichainToken({
        multichainToken: buildMultichainToken({ bnbDecimals: 18 }),
        chainId: UniverseChainId.Mainnet,
      })?.decimals,
    ).toBe(6)
  })

  it('ignores `addresses` and returns undefined for a persisted row without a deployments key', () => {
    expect(
      deriveTokenFromMultichainToken({
        multichainToken: buildPersistedRowWithoutDeployments(),
        chainId: UniverseChainId.Bnb,
      }),
    ).toBeUndefined()
  })
})
