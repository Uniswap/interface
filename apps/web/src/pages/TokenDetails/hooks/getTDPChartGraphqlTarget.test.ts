import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getTDPChartGraphqlTarget } from '~/pages/TokenDetails/hooks/getTDPChartGraphqlTarget'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

function buildMultichainToken(addresses: Record<string, string>): PlainMessage<MultichainToken> {
  return {
    multichainId: 'mc-test',
    addresses,
    symbol: 'TEST',
    decimals: 18,
    name: 'Test Token',
    type: 2,
    price: undefined,
    safety: undefined,
    fees: undefined,
    project: undefined,
  }
}

describe('getTDPChartGraphqlTarget', () => {
  const pathChain = GraphQLApi.Chain.Ethereum
  const pathAddress = '0xPath'

  it('uses path when no network is selected', () => {
    expect(
      getTDPChartGraphqlTarget({
        selectedMultichainChainId: undefined,
        multichainToken: buildMultichainToken({}),
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: pathChain, address: pathAddress })
  })

  it('uses the selected chain deployment from the multichain addresses map', () => {
    const multichainToken = buildMultichainToken({
      [String(UniverseChainId.Mainnet)]: '0xeth',
      [String(UniverseChainId.Base)]: '0xbase',
    })

    expect(
      getTDPChartGraphqlTarget({
        selectedMultichainChainId: UniverseChainId.Base,
        multichainToken,
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: GraphQLApi.Chain.Base, address: '0xbase' })
  })

  it('maps native deployments to the DB native address', () => {
    const multichainToken = buildMultichainToken({
      [String(UniverseChainId.Mainnet)]: DEFAULT_NATIVE_ADDRESS,
    })

    expect(
      getTDPChartGraphqlTarget({
        selectedMultichainChainId: UniverseChainId.Mainnet,
        multichainToken,
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: GraphQLApi.Chain.Ethereum, address: getNativeTokenDBAddress(GraphQLApi.Chain.Ethereum) })
  })

  it('falls back to path when the selected chain has no deployment', () => {
    expect(
      getTDPChartGraphqlTarget({
        selectedMultichainChainId: UniverseChainId.Base,
        multichainToken: buildMultichainToken({ [String(UniverseChainId.Mainnet)]: '0xeth' }),
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: pathChain, address: pathAddress })
  })
})
