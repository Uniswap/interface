import 'test-utils/tokens/mocks'

import { BigNumber } from '@ethersproject/bignumber'
import { useFilterPossiblyMaliciousPositions } from 'hooks/useFilterPossiblyMaliciousPositions'
import { useTokenContractsConstant } from 'hooks/useTokenContractsConstant'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { PositionDetails } from 'types/position'

vi.mock('./useTokenContractsConstant')

const positions: PositionDetails[] = [
  {
    tokenId: BigNumber.from('0x02'),
    fee: 3000,
    feeGrowthInside0LastX128: BigNumber.from('0x168af578d503c230c7fabeef7c38'),
    feeGrowthInside1LastX128: BigNumber.from('0x9691f41769e1a6a196e8f5bcddf89c'),
    liquidity: BigNumber.from('0xa0deffe49ff1158e'),
    nonce: BigNumber.from('0x00'),
    operator: '0x0000000000000000000000000000000000000000',
    tickLower: -887220,
    tickUpper: 887220,
    token0: '0x4200000000000000000000000000000000000006',
    token1: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    tokensOwed0: BigNumber.from('0x00'),
    tokensOwed1: BigNumber.from('0x00'),
  },
  {
    tokenId: BigNumber.from('0x03'),
    fee: 3000,
    feeGrowthInside0LastX128: BigNumber.from('0x00'),
    feeGrowthInside1LastX128: BigNumber.from('0x00'),
    liquidity: BigNumber.from('0x0e422f1864e669076d'),
    nonce: BigNumber.from('0x00'),
    operator: '0x0000000000000000000000000000000000000000',
    tickLower: 72660,
    tickUpper: 80820,
    token0: '0x4200000000000000000000000000000000000006',
    token1: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    tokensOwed0: BigNumber.from('0x00'),
    tokensOwed1: BigNumber.from('0x00'),
  },
  {
    tokenId: BigNumber.from('0x047aa5'),
    fee: 3000,
    feeGrowthInside0LastX128: BigNumber.from('0x00'),
    feeGrowthInside1LastX128: BigNumber.from('0x00'),
    liquidity: BigNumber.from('0x8ac7230489e80001'),
    nonce: BigNumber.from('0x00'),
    operator: '0x0000000000000000000000000000000000000000',
    tickLower: -120,
    tickUpper: 120,
    token0: '0x75E5509029c85fE08e4934B1275c5575aA5538bE',
    token1: '0xB85C51F89788C1B3Bd4568f773e8FfB40cA587Bb',
    tokensOwed0: BigNumber.from('0x00'),
    tokensOwed1: BigNumber.from('0x00'),
  },
]

describe('useFilterPossiblyMaliciousPositions', () => {
  beforeEach(() => {
    mocked(useTokenContractsConstant).mockReturnValue([])
  })
  it('filters out unsafe positions', async () => {
    mocked(useTokenContractsConstant).mockReturnValue([{ result: 'Uniswap-LP.org' }, { result: 'Claim Rewards' }])

    const { result } = renderHook(() => useFilterPossiblyMaliciousPositions(positions))

    expect(result.current.some((position) => position.token1 === '0xB85C51F89788C1B3Bd4568f773e8FfB40cA587Bb')).toEqual(
      false,
    )
  })
})
