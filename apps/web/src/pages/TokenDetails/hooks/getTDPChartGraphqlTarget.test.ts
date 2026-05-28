import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { getTDPChartGraphqlTarget } from '~/pages/TokenDetails/hooks/getTDPChartGraphqlTarget'

describe('getTDPChartGraphqlTarget', () => {
  const pathChain = GraphQLApi.Chain.Ethereum
  const pathAddress = '0xPath'

  it('uses path chain and address when multichain UX is off', () => {
    expect(
      getTDPChartGraphqlTarget({
        multichainTokenUxEnabled: false,
        selectedMultichainChainId: UniverseChainId.Base,
        tokenQueryData: undefined,
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: pathChain, address: pathAddress })
  })

  it('uses path when multichain UX is on but no network is selected', () => {
    expect(
      getTDPChartGraphqlTarget({
        multichainTokenUxEnabled: true,
        selectedMultichainChainId: undefined,
        tokenQueryData: { project: { tokens: [] } } as unknown as TokenQueryData,
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: pathChain, address: pathAddress })
  })

  it('uses project deployment when multichain UX is on and a network is selected', () => {
    const tokenQueryData = {
      project: {
        tokens: [
          { chain: GraphQLApi.Chain.Ethereum, address: '0xeth' },
          { chain: GraphQLApi.Chain.Base, address: '0xbase' },
        ],
      },
    } as unknown as TokenQueryData

    expect(
      getTDPChartGraphqlTarget({
        multichainTokenUxEnabled: true,
        selectedMultichainChainId: UniverseChainId.Base,
        tokenQueryData,
        pathGraphqlChain: pathChain,
        pathTokenDbAddress: pathAddress,
      }),
    ).toEqual({ chain: GraphQLApi.Chain.Base, address: '0xbase' })
  })
})
