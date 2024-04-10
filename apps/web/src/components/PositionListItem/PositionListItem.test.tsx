import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Token, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { PoolState, usePool } from 'hooks/usePools'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import PositionListItem from '.'

jest.mock('components/DoubleLogo')
jest.mock('hooks/Tokens')
jest.mock('hooks/usePools')
jest.mock('utils/unwrappedToken')

beforeEach(() => {
  mocked(useToken).mockImplementation((tokenAddress?: string | null | undefined) => {
    if (!tokenAddress) return null
    return new Token(1, tokenAddress, 6, 'symbol', 'name')
  })
  mocked(usePool).mockReturnValue([
    PoolState.EXISTS,
    // tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number
    new Pool(
      USDC_MAINNET,
      WETH9[ChainId.MAINNET],
      FeeAmount.MEDIUM,
      '1745948049099224684665158875285708',
      '4203610460178577802',
      200019
    ),
  ])
})

test('PositionListItem should render a position', () => {
  const positionDetails = {
    token0: USDC_MAINNET.address,
    token1: WETH9[ChainId.MAINNET].address,
    tokenId: BigNumber.from(479689),
    fee: FeeAmount.MEDIUM,
    liquidity: BigNumber.from('1341008833950736'),
    tickLower: 200040,
    tickUpper: 202560,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).not.toBeEmptyDOMElement()
})
