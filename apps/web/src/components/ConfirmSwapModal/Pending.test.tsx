import 'test-utils/tokens/mocks'

import { BigNumber } from '@ethersproject/bignumber'
import { WETH9 } from '@uniswap/sdk-core'
import { Pending } from 'components/ConfirmSwapModal/Pending'
import { SwapResult, useSwapTransactionStatus } from 'hooks/useSwapCallback'
import { TradeFillType } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { LIMIT_ORDER_TRADE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

jest.mock('state/transactions/hooks', () => ({
  ...jest.requireActual('state/transactions/hooks'),
  useIsTransactionConfirmed: jest.fn(),
}))

jest.mock('hooks/useSwapCallback', () => ({
  ...jest.requireActual('hooks/useSwapCallback'),
  useSwapTransactionStatus: jest.fn(),
}))

jest.mock('state/signatures/hooks', () => ({
  ...jest.requireActual('state/signatures/hooks'),
  useOrder: jest.fn(),
}))

const classicSwapResult: SwapResult = {
  type: TradeFillType.Classic,
  response: {
    hash: '0x123',
    timestamp: 1000,
    from: '0x123',
    wait: jest.fn(),
    nonce: 1,
    gasLimit: BigNumber.from(1000),
    data: '0x',
    value: BigNumber.from(0),
    chainId: UniverseChainId.Mainnet,
    confirmations: 0,
    blockNumber: undefined,
    blockHash: undefined,
  },
}

const uniswapXSwapResult: SwapResult = {
  type: TradeFillType.UniswapX,
  response: {
    orderHash: '0x1234',
    deadline: 1234,
    encodedOrder: '0xencodedOrder',
  },
}

const filledOrderDetails: UniswapXOrderDetails = {
  type: SignatureType.SIGN_LIMIT,
  orderHash: '0x1234',
  status: UniswapXOrderStatus.FILLED,
  swapInfo: {
    isUniswapXOrder: true,
    type: 1,
    tradeType: 0,
    inputCurrencyId: '0x6b175474e89094c44da98b954eedeac495271d0f',
    outputCurrencyId: WETH9[UniverseChainId.Mainnet].address,
    inputCurrencyAmountRaw: '252074033564766400000',
    expectedOutputCurrencyAmountRaw: '106841079134757921',
    minimumOutputCurrencyAmountRaw: '106841079134757921',
    settledOutputCurrencyAmountRaw: '106841079134757921',
  },
  txHash: '0x1234',
  encodedOrder: '0xencodedOrder',
  id: '0x1234',
  addedTime: 3,
  chainId: UniverseChainId.Mainnet,
  expiry: 4,
  offerer: '0x1234',
}

describe('Pending - classic trade titles', () => {
  it.each([
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, classicSwapResult, TransactionStatus.Pending, 'Swap submitted'],
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, classicSwapResult, TransactionStatus.Confirmed, 'Swap success!'],
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, undefined, undefined, 'Confirm swap'],
  ])(
    'renders classic trade correctly, with approvalPending= %p , revocationPending= %p, wrapTxHash= %p',
    async (approvalPending, revocationPending, wrapTxHash, trade, swapResult, swapTxStatus, expectedTitle) => {
      mocked(useSwapTransactionStatus).mockReturnValue(swapTxStatus)
      const { asFragment } = render(
        <Pending
          trade={trade}
          tokenApprovalPending={approvalPending}
          revocationPending={revocationPending}
          wrapTxHash={wrapTxHash}
          swapResult={swapResult}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
      expect(screen.getByText(expectedTitle)).toBeInTheDocument()
    },
  )
})

describe('Pending - uniswapX trade titles', () => {
  it.each([
    [false, false, undefined, LIMIT_ORDER_TRADE, uniswapXSwapResult, undefined, 'Limit submitted'],
    [false, false, undefined, LIMIT_ORDER_TRADE, uniswapXSwapResult, filledOrderDetails, 'Limit filled!'],
    [false, false, undefined, LIMIT_ORDER_TRADE, undefined, undefined, 'Confirm limit'],
  ])(
    'renders limit order correctly, with approvalPending= %p , revocationPending= %p, wrapTxHash= %p',
    async (approvalPending, revocationPending, wrapTxHash, trade, swapResult, orderDetails, expectedTitle) => {
      mocked(useOrder).mockReturnValue(orderDetails)
      const { asFragment } = render(
        <Pending
          trade={trade}
          tokenApprovalPending={approvalPending}
          revocationPending={revocationPending}
          wrapTxHash={wrapTxHash}
          swapResult={swapResult}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
      expect(screen.getByText(expectedTitle)).toBeInTheDocument()
    },
  )
})
