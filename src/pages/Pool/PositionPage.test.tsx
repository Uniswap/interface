import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, WETH9 } from '@thinkincoin-libs/sdk-core'
import { FeeAmount, Pool } from '@thinkincoin-libs/uniswap-v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { PoolState, usePool } from 'hooks/usePools'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import * as useV3Positions from 'hooks/useV3Positions'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen } from 'test-utils/render'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import PositionPage from './PositionPage'

jest.mock('hooks/Tokens')
jest.mock('utils/unwrappedToken')
jest.mock('hooks/useV3Positions')
jest.mock('hooks/useV3PositionFees')
jest.mock('hooks/usePools')

const positionDetails: PositionDetails = {
  tokenId: BigNumber.from('0x080e9e'),
  fee: 500,
  feeGrowthInside0LastX128: BigNumber.from('0xfffffffffffffffffffffffffffffffffffff14da6c0d4c3e0f2ff473efb5278'),
  feeGrowthInside1LastX128: BigNumber.from('0xfffffffffffffffffffffffffffffd7e342f500425d9f6c176349d1ef4621e0d'),
  liquidity: BigNumber.from('0x053745fc922dd81cdf'),
  nonce: BigNumber.from(0),
  operator: '0x0000000000000000000000000000000000000000',
  tickLower: 200950,
  tickUpper: 200970,
  token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  tokensOwed0: BigNumber.from(0),
  tokensOwed1: BigNumber.from(0),
}

const pool = new Pool(
  USDC_MAINNET,
  WETH9[1],
  FeeAmount.LOW,
  '1829845065927797685282268152898194',
  '118646741804633449199',
  200958
)

const USDC_AMOUNT = CurrencyAmount.fromRawAmount(USDC_MAINNET, '1224156977')
const WETH_AMOUNT = CurrencyAmount.fromRawAmount(WETH9[1], '500807669662847869')

describe('position page', () => {
  it('correctly collects the correct amount', () => {
    mocked(useV3Positions.useV3PositionFromTokenId).mockImplementation(() => {
      return { loading: false, position: positionDetails }
    })
    mocked(useToken).mockImplementation((tokenAddress?: string | null | undefined) => {
      if (!tokenAddress) return null

      if (tokenAddress === USDC_MAINNET.address) {
        return USDC_MAINNET
      } else {
        return WETH9[1]
      }
    })
    mocked(usePool).mockImplementation(() => {
      return [PoolState.EXISTS, pool]
    })
    mocked(useV3PositionFees).mockImplementation(() => {
      return [USDC_AMOUNT, WETH_AMOUNT]
    })

    render(<PositionPage />)

    const collectFeesButton = screen.queryByTestId('collect-fees-button') as HTMLButtonElement
    expect(collectFeesButton).toBeInTheDocument()
    expect(screen.getByText('Collect fees')).toBeInTheDocument()
    expect(screen.getByText(formatCurrencyAmount(USDC_AMOUNT, 4))).toBeInTheDocument()
    expect(screen.getByText(formatCurrencyAmount(WETH_AMOUNT, 4))).toBeInTheDocument()
    fireEvent.click(collectFeesButton)
    expect(screen.getByText('Collecting fees will withdraw currently available fees for you.')).toBeInTheDocument()
    const modalCollectFeesButton = screen.queryByTestId('modal-collect-fees-button') as HTMLButtonElement
    expect(modalCollectFeesButton).toBeInTheDocument()
    fireEvent.click(modalCollectFeesButton)
  })
})
