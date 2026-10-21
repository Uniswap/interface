import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import {
  PoolHoverCardContent,
  type PoolHoverCardContentProps,
} from '~/components/HoverCard/PoolHoverCard/PoolHoverCardContent'
import { render, screen } from '~/test-utils/render'

const toCurrencyInfo = (currency: typeof USDC_MAINNET) =>
  buildCurrencyInfo({ currency, currencyId: currencyId(currency), logoUrl: null, isSpam: false })

const baseProps: PoolHoverCardContentProps = {
  poolId: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  chainId: UniverseChainId.Mainnet,
  token0CurrencyInfo: toCurrencyInfo(USDC_MAINNET),
  token1CurrencyInfo: toCurrencyInfo(DAI),
  protocolVersion: ProtocolVersion.V3,
  feeTier: 500,
  volume1dUsd: 68_500_000,
  hourlyVolumes: [10, 20, 30],
  loading: false,
  isCopied: false,
  onCopy: vi.fn(),
}

describe('PoolHoverCardContent', () => {
  it('shows the pair, pool address, version and fee, and 1D volume', () => {
    render(<PoolHoverCardContent {...baseProps} />)

    expect(screen.getByText('USDC / DAI')).toBeInTheDocument()
    expect(screen.getByText('0x88e6...5640')).toBeInTheDocument()
    expect(screen.getByText('v3')).toBeInTheDocument()
    expect(screen.getByText('0.05%')).toBeInTheDocument()
    expect(screen.getByText('$68.5M')).toBeInTheDocument()
    expect(screen.getByText('1D vol')).toBeInTheDocument()
  })

  it('sums the hourly bars when the row carries no 1D volume', () => {
    render(<PoolHoverCardContent {...baseProps} volume1dUsd={undefined} hourlyVolumes={[1_000_000, 2_000_000]} />)

    expect(screen.getByText('$3.0M')).toBeInTheDocument()
  })
})
