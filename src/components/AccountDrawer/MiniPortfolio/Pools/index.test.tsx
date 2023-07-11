import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, WETH9 } from '@thinkincoin-libs/sdk-core'
import { FeeAmount, Pool, Position } from '@thinkincoin-libs/uniswap-v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import Pools from '.'
import useMultiChainPositions from './useMultiChainPositions'

jest.mock('./useMultiChainPositions')

jest.spyOn(console, 'warn').mockImplementation()

const owner = '0xf5b6bb25f5beaea03dd014c6ef9fa9f3926bf36c'

const pool = new Pool(
  USDC_MAINNET,
  WETH9[ChainId.MAINNET],
  FeeAmount.MEDIUM,
  '1851127709498178402383049949138810',
  '7076437181775065414',
  201189
)

const position = new Position({
  pool,
  liquidity: 1341008833950736,
  tickLower: 200040,
  tickUpper: 202560,
})
const details = {
  nonce: BigNumber.from('0'),
  tokenId: BigNumber.from('0'),
  operator: '0x0',
  token0: USDC_MAINNET.address,
  token1: WETH9[ChainId.MAINNET].address,
  fee: FeeAmount.MEDIUM,
  tickLower: -100,
  tickUpper: 100,
  liquidity: BigNumber.from('9000'),
  feeGrowthInside0LastX128: BigNumber.from('0'),
  feeGrowthInside1LastX128: BigNumber.from('0'),
  tokensOwed0: BigNumber.from('0'),
  tokensOwed1: BigNumber.from('0'),
}
const useMultiChainPositionsReturnValue = {
  positions: [
    {
      owner,
      chainId: ChainId.MAINNET,
      position,
      pool,
      details,
      inRange: true,
      closed: false,
    },
  ],
  loading: false,
}

beforeEach(() => {
  mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
})
test('Pools should render LP positions', () => {
  const props = { account: owner }
  const { container } = render(<Pools {...props} />)
  expect(container).not.toBeEmptyDOMElement()
})
