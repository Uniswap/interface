import { BigNumber } from '@ethersproject/bignumber'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import PositionListItem from 'components/PositionListItem'
import { useToken } from 'hooks/Tokens'
import { PoolState, usePool } from 'hooks/usePools'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'

jest.mock('components/Logo/DoubleLogo')
jest.mock('hooks/Tokens')
jest.mock('hooks/usePools')
jest.mock('utils/unwrappedToken')

beforeEach(() => {
  mocked(useToken).mockImplementation((tokenAddress?: string) => {
    if (!tokenAddress) {
      return undefined
    }
    return new Token(1, tokenAddress, 6, 'symbol', 'name')
  })
  mocked(usePool).mockReturnValue([
    PoolState.EXISTS,
    // tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number
    new Pool(
      USDC_MAINNET,
      WETH9[UniverseChainId.Mainnet],
      FeeAmount.MEDIUM,
      '1745948049099224684665158875285708',
      '4203610460178577802',
      200019,
    ),
  ])
})

test('PositionListItem should render a position', () => {
  const positionDetails = {
    token0: USDC_MAINNET.address,
    token1: WETH9[UniverseChainId.Mainnet].address,
    tokenId: BigNumber.from(479689),
    fee: FeeAmount.MEDIUM,
    liquidity: BigNumber.from('1341008833950736'),
    tickLower: 200040,
    tickUpper: 202560,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).not.toBeEmptyDOMElement()
})
