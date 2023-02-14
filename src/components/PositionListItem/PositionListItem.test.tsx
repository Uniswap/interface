import { BigNumber } from '@ethersproject/bignumber'
import { render, screen } from 'test-utils'

import PositionListItem from '.'

jest.mock('hooks/Tokens', () => {
  const originalModule = jest.requireActual('hooks/Tokens')
  const uniSDK = jest.requireActual('@uniswap/sdk-core')
  return {
    __esModule: true,
    ...originalModule,
    useToken: jest.fn(
      () =>
        new uniSDK.Token(
          1,
          '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
          8,
          'https://www.example.com',
          'example.com coin'
        )
    ),
  }
})

test('PositionListItem should not render when the name contains a url', () => {
  const positionDetails = {
    token0: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokenId: BigNumber.from(436148),
    fee: 100,
    liquidity: BigNumber.from('0x5c985aff8059be04'),
    tickLower: -800,
    tickUpper: 1600,
  }
  render(<PositionListItem {...positionDetails} />)
  screen.debug()
  expect(screen.queryByText('.com', { exact: false })).toBe(null)
})
