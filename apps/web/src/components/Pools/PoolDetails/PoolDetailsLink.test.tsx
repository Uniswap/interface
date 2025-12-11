import 'test-utils/tokens/mocks'

import { PoolDetailsLink } from 'components/Pools/PoolDetails/PoolDetailsLink'
import store from 'state'
import { usdcWethPoolAddress, validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

describe('PoolDetailsHeader', () => {
  beforeEach(() => {
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
  })

  it('renders link for pool address', async () => {
    const { asFragment } = render(
      <PoolDetailsLink
        address={usdcWethPoolAddress}
        chainId={UniverseChainId.Mainnet}
        tokens={[validBEPoolToken0, validBEPoolToken1]}
      />,
    )
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('USDC / WETH')).toBeInTheDocument()
    expect(screen.getByTestId('pdp-pool-logo-USDC-WETH')).toBeInTheDocument()
    expect(screen.getByTestId(`copy-address-${usdcWethPoolAddress}`)).toBeInTheDocument()
    expect(screen.getByTestId(`explorer-url-https://etherscan.io/address/${usdcWethPoolAddress}`)).toBeInTheDocument()
  })

  it('renders link for token address', async () => {
    const { asFragment } = render(
      <PoolDetailsLink address={USDC_MAINNET.address} chainId={UniverseChainId.Mainnet} tokens={[validBEPoolToken0]} />,
    )
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByTestId('pdp-token-logo-USDC')).toBeInTheDocument()
    expect(screen.getByTestId(`copy-address-${USDC_MAINNET.address}`)).toBeInTheDocument()
    expect(screen.getByTestId(`explorer-url-https://etherscan.io/token/${USDC_MAINNET.address}`)).toBeInTheDocument()
  })
})
