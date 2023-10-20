import { ChainId } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'constants/tokens'
import { usdcWethPoolAddress, validPoolToken0, validPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

import { PoolDetailsLink } from './PoolDetailsLink'

describe('PoolDetailsHeader', () => {
  it('renders link for pool address', async () => {
    const { asFragment } = render(
      <PoolDetailsLink
        address={usdcWethPoolAddress}
        chainId={ChainId.MAINNET}
        tokens={[validPoolToken0, validPoolToken1]}
      />
    )
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('USDC / WETH')).toBeInTheDocument()
    expect(screen.getByTestId('pdp-pool-logo-USDC-WETH')).toBeInTheDocument()
    expect(screen.getByTestId(`copy-address-${usdcWethPoolAddress}`)).toBeInTheDocument()
    expect(screen.getByTestId(`explorer-url-https://etherscan.io/address/${usdcWethPoolAddress}`)).toBeInTheDocument()
  })

  it('renders link for token address', async () => {
    const { asFragment } = render(
      <PoolDetailsLink address={USDC_MAINNET.address} chainId={ChainId.MAINNET} tokens={[validPoolToken0]} />
    )
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByTestId('pdp-token-logo-USDC')).toBeInTheDocument()
    expect(screen.getByTestId(`copy-address-${USDC_MAINNET.address}`)).toBeInTheDocument()
    expect(screen.getByTestId(`explorer-url-https://etherscan.io/token/${USDC_MAINNET.address}`)).toBeInTheDocument()
  })
})
