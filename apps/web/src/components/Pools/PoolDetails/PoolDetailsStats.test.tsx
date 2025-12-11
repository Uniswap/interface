import 'test-utils/tokens/mocks'

import { PoolDetailsStats } from 'components/Pools/PoolDetails/PoolDetailsStats'
import { enableNetConnect } from 'nock'
import store from 'state'
import mockMediaSize from 'test-utils/mockMediaSize'
import { validPoolDataResponse } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

vi.mock('tamagui', async () => {
  const actual = await vi.importActual('tamagui')
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

describe('PoolDetailsStats', () => {
  const mockProps = {
    poolData: validPoolDataResponse.data,
    isReversed: false,
    chainId: 1,
    tokenAColor: '#FF37C7',
    tokenBColor: '#222222',
  }

  beforeEach(() => {
    // Enable network connections for retrieving token logos
    enableNetConnect()
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

  it('renders stats text correctly', async () => {
    mockMediaSize('xxl')

    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    // After the first render, the extracted color is updated to an a11y compliant color
    // This is why we need to wrap the fragment in act(...)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Stats/i)).toBeInTheDocument()
    expect(screen.getByText('90.9M')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('82.5K')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText(/TVL/i)).toBeInTheDocument()
    expect(screen.getByText('$223.2M')).toBeInTheDocument()
    expect(screen.getByTestId('pool-balance-chart')).toBeInTheDocument()
  })

  it('pool balance chart not visible on mobile', async () => {
    mockMediaSize('xl')
    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.queryByTestId('pool-balance-chart')).toBeNull()
  })
})
