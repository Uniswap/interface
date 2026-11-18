import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import type { PoolData } from '~/data/pools/poolData'
import { usePdpFlowActivity } from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'
import { PdpLiquidityProvider } from '~/pages/PoolDetails/components/LiquidityPanel/PdpLiquidityProvider'
import { render, screen } from '~/test-utils/render'

function FlowProbe(): JSX.Element {
  return <span>{usePdpFlowActivity() ? 'in flow' : 'no flow'}</span>
}

function poolWith(protocolVersion: ProtocolVersion | undefined): PoolData {
  return {
    idOrAddress: '0xpool',
    protocolVersion,
    token0: {
      chainId: UniverseChainId.Mainnet,
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      symbol: 'DAI',
    },
    token1: {
      chainId: UniverseChainId.Mainnet,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
    },
  } as unknown as PoolData
}

function renderProvider(protocolVersion: ProtocolVersion | undefined): void {
  render(
    <PdpLiquidityProvider poolData={poolWith(protocolVersion)} chainId={UniverseChainId.Mainnet} priceInverted={false}>
      <FlowProbe />
    </PdpLiquidityProvider>,
  )
}

describe('PdpLiquidityProvider', () => {
  it('mounts the deposit flow for a pool of known version', () => {
    renderProvider(ProtocolVersion.V3)
    expect(screen.getByText('in flow')).toBeInTheDocument()
  })

  it.each([undefined, ProtocolVersion.UNSPECIFIED])(
    'renders the page without the deposit flow when the pool version is %s',
    (protocolVersion) => {
      renderProvider(protocolVersion)
      expect(screen.getByText('no flow')).toBeInTheDocument()
    },
  )
})
