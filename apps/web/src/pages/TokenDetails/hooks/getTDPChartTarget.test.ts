import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { getTDPChartTarget } from '~/pages/TokenDetails/hooks/getTDPChartTarget'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

function buildMultichainToken(addresses: Record<string, string>): PlainMessage<MultichainToken> {
  return {
    multichainId: 'mc-test',
    addresses,
    deployments: Object.fromEntries(
      Object.entries(addresses).map(([chainId, address]) => [chainId, { address, decimals: 18 }]),
    ),
    symbol: 'TEST',
    decimals: 18,
    name: 'Test Token',
    type: 2,
    price: undefined,
    safety: undefined,
    fees: undefined,
    project: undefined,
    categoryIds: [],
  }
}

describe('getTDPChartTarget', () => {
  const pathChainId = UniverseChainId.Mainnet
  const pathAddress = '0xPath'

  it('uses path when no network is selected', () => {
    expect(
      getTDPChartTarget({
        selectedMultichainChainId: undefined,
        multichainToken: buildMultichainToken({}),
        pathChainId,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chainId: pathChainId, address: pathAddress })
  })

  it('uses the selected chain deployment from the multichain addresses map', () => {
    const multichainToken = buildMultichainToken({
      [String(UniverseChainId.Mainnet)]: '0xeth',
      [String(UniverseChainId.Base)]: '0xbase',
    })

    expect(
      getTDPChartTarget({
        selectedMultichainChainId: UniverseChainId.Base,
        multichainToken,
        pathChainId,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chainId: UniverseChainId.Base, address: '0xbase' })
  })

  it('maps native deployments to the DB native address', () => {
    const multichainToken = buildMultichainToken({
      [String(UniverseChainId.Mainnet)]: DEFAULT_NATIVE_ADDRESS,
    })

    expect(
      getTDPChartTarget({
        selectedMultichainChainId: UniverseChainId.Mainnet,
        multichainToken,
        pathChainId,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, address: getNativeTokenDBAddress(UniverseChainId.Mainnet) })
  })

  it('falls back to path when the selected chain has no deployment', () => {
    expect(
      getTDPChartTarget({
        selectedMultichainChainId: UniverseChainId.Base,
        multichainToken: buildMultichainToken({ [String(UniverseChainId.Mainnet)]: '0xeth' }),
        pathChainId,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chainId: pathChainId, address: pathAddress })
  })
})
