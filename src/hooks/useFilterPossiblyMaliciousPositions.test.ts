import { BigNumber } from '@ethersproject/bignumber'
import { CallState } from '@uniswap/redux-multicall'
import { renderHook } from 'test-utils/render'
import { PositionDetails } from 'types/position'

import { useFilterPossiblyMaliciousPositions } from './useFilterPossiblyMaliciousPositions'
import { useTokenContractsConstant } from './useTokenContractsConstant'

jest.mock('./useTokenContractsConstant')
jest.mock('./Tokens', () => {
  return {
    useDefaultActiveTokens: () => ({
      '0x4200000000000000000000000000000000000006': {
        chainId: 10,
        address: '0x4200000000000000000000000000000000000006',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        logoURI: 'https://ethereum-optimism.github.io/data/WETH/logo.png',
        extensions: {},
      },
      '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': {
        chainId: 10,
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        logoURI: 'https://ethereum-optimism.github.io/data/DAI/logo.svg',
        extensions: {
          optimismBridgeAddress: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        },
      },
    }),
  }
})

const mockUseTokenContractsConstant = useTokenContractsConstant as jest.MockedFunction<typeof useTokenContractsConstant>

beforeEach(() => {
  mockUseTokenContractsConstant.mockReturnValue([])
})
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

const unsafeReturnValue: CallState[] = [
  {
    valid: true,
    loading: false,
    syncing: false,
    result: ['Uniswap-LP.org'],
    error: false,
  },
  {
    valid: true,
    loading: false,
    syncing: false,
    result: ['Claim Rewards'],
    error: false,
  },
]

describe('useFilterPossiblyMaliciousPositions', () => {
  it('filters out unsafe positions', async () => {
    mockUseTokenContractsConstant.mockReturnValue(unsafeReturnValue)

    const { result } = renderHook(() => useFilterPossiblyMaliciousPositions(positions))

    expect(result.current.some((position) => position.token1 === '0xB85C51F89788C1B3Bd4568f773e8FfB40cA587Bb')).toEqual(
      false
    )
  })
  it('checks the chain for addresses not on the token list', async () => {
    mockUseTokenContractsConstant.mockReturnValue(unsafeReturnValue)
    renderHook(() => useFilterPossiblyMaliciousPositions(positions))

    expect(mockUseTokenContractsConstant).toHaveBeenCalledWith(
      ['0x75E5509029c85fE08e4934B1275c5575aA5538bE', '0xB85C51F89788C1B3Bd4568f773e8FfB40cA587Bb'],
      'symbol'
    )
  })
})
