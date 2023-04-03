import { BigNumber } from '@ethersproject/bignumber'
import { SupportedChainId, Token, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { PoolState } from 'hooks/usePools'
import { render } from 'test-utils'
import { unwrappedToken } from 'utils/unwrappedToken'

import PositionListItem from '.'

jest.mock('utils/unwrappedToken')
const mockUnwrappedToken = unwrappedToken as jest.MockedFunction<typeof unwrappedToken>

jest.mock('hooks/usePools')
const mockUsePool = usePool as jest.MockedFunction<typeof usePool>

jest.mock('hooks/Tokens')
const mockUseToken = useToken as jest.MockedFunction<typeof useToken>

// eslint-disable-next-line react/display-name
jest.mock('components/DoubleLogo', () => () => <div />)

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

const susToken0Address = '0x39AA39c021dfbaE8faC545936693aC917d5E7563'

beforeEach(() => {
  const susToken0 = new Token(1, susToken0Address, 8, 'https://www.example.com', 'example.com coin')
  mockUseToken.mockImplementation((tokenAddress?: string | null | undefined) => {
    if (!tokenAddress) return null
    if (tokenAddress === susToken0.address) return susToken0
    return new Token(1, tokenAddress, 8, 'symbol', 'name')
  })
  mockUsePool.mockReturnValue([
    PoolState.EXISTS,
    new Pool(susToken0, USDC_MAINNET, FeeAmount.HIGH, '2437312313659959819381354528', '10272714736694327408', -69633),
  ])
  mockUnwrappedToken.mockReturnValue(susToken0)
})

test('PositionListItem should not render when token0 symbol contains a url', () => {
  const positionDetails = {
    token0: susToken0Address,
    token1: USDC_MAINNET.address,
    tokenId: BigNumber.from(436148),
    fee: 100,
    liquidity: BigNumber.from('0x5c985aff8059be04'),
    tickLower: -800,
    tickUpper: 1600,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).toBeEmptyDOMElement()
})

test('PositionListItem should not render when token1 symbol contains a url', () => {
  const positionDetails = {
    token0: USDC_MAINNET.address,
    token1: susToken0Address,
    tokenId: BigNumber.from(436148),
    fee: 100,
    liquidity: BigNumber.from('0x5c985aff8059be04'),
    tickLower: -800,
    tickUpper: 1600,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).toBeEmptyDOMElement()
})

test('PositionListItem should render a position', () => {
  const positionDetails = {
    token0: USDC_MAINNET.address,
    token1: WETH9[SupportedChainId.MAINNET].address,
    tokenId: BigNumber.from(436148),
    fee: 100,
    liquidity: BigNumber.from('0x5c985aff8059be04'),
    tickLower: -800,
    tickUpper: 1600,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).not.toBeEmptyDOMElement()
})
