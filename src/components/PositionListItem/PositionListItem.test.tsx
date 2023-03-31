import { BigNumber } from '@ethersproject/bignumber'
import { SupportedChainId, Token, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { PoolState } from 'hooks/usePools'
import { render } from 'test-utils'

import PositionListItem from '.'

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

beforeEach(() => {
  mockUseToken.mockImplementation((tokenAddress?: string | null | undefined) => {
    if (!tokenAddress) return null
    return new Token(1, tokenAddress, 8, 'symbol', 'name')
  })

  const pool = new Pool(
    USDC_MAINNET,
    WETH9[SupportedChainId.MAINNET],
    FeeAmount.MEDIUM,
    '1851127709498178402383049949138810',
    '7076437181775065414',
    201189
  )
  mockUsePool.mockReturnValue([PoolState.EXISTS, pool])
})

test('PositionListItem should render a position', () => {
  const positionDetails = {
    token0: USDC_MAINNET.address,
    token1: WETH9[SupportedChainId.MAINNET].address,
    tokenId: BigNumber.from(479689),
    fee: FeeAmount.MEDIUM,
    liquidity: BigNumber.from('1341008833950736'),
    tickLower: 200040,
    tickUpper: 202560,
  }
  const { container } = render(<PositionListItem {...positionDetails} />)
  expect(container).not.toBeEmptyDOMElement()
})
