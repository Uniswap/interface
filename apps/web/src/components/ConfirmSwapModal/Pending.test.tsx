import 'test-utils/tokens/mocks'

import { BigNumber } from '@ethersproject/bignumber'
import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { Pending } from 'components/ConfirmSwapModal/Pending'
import { SwapResult, useSwapTransactionStatus } from 'hooks/useSwapCallback'
import { TradeFillType } from 'state/routing/types'
import { useUniswapXOrderByOrderHash } from 'state/transactions/hooks'
import { LIMIT_ORDER_TRADE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'

vi.mock('state/transactions/hooks', async () => {
  const actual = await vi.importActual('state/transactions/hooks')
  return {
    ...actual,
    useUniswapXOrderByOrderHash: vi.fn(),
    useIsTransactionConfirmed: vi.fn(),
  }
})

vi.mock('hooks/useSwapCallback', async () => {
  const actual = await vi.importActual('hooks/useSwapCallback')
  return {
    ...actual,
    useSwapTransactionStatus: vi.fn(),
  }
})

const classicSwapResult: SwapResult = {
  type: TradeFillType.Classic,
  response: {
    hash: '0x123',
    timestamp: 1000,
    from: '0x123',
    wait: vi.fn(),
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
  routing: TradingApi.Routing.DUTCH_LIMIT,
  orderHash: '0x1234',
  status: TransactionStatus.Success,
  typeInfo: {
    isUniswapXOrder: true,
    type: TransactionType.Swap,
    tradeType: 0,
    inputCurrencyId: currencyId(DAI),
    outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
    inputCurrencyAmountRaw: '252074033564766400000',
    expectedOutputCurrencyAmountRaw: '106841079134757921',
    minimumOutputCurrencyAmountRaw: '106841079134757921',
    settledOutputCurrencyAmountRaw: '106841079134757921',
  },
  hash: '0x1234',
  encodedOrder: '0xencodedOrder',
  id: '0x1234',
  addedTime: 3,
  chainId: UniverseChainId.Mainnet,
  expiry: 4,
  from: '0x1234',
  transactionOriginType: TransactionOriginType.Internal,
}

describe('Pending - classic trade titles', () => {
  it.each([
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, classicSwapResult, TransactionStatus.Pending, 'Swap submitted'],
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, classicSwapResult, TransactionStatus.Success, 'Swap success!'],
    [false, false, undefined, TEST_TRADE_EXACT_INPUT, undefined, undefined, 'Confirm swap'],
  ])(
    'renders classic trade correctly, with approvalPending= %p , revocationPending= %p, wrapTxHash= %p',
    // eslint-disable-next-line max-params
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
    // eslint-disable-next-line max-params
    async (approvalPending, revocationPending, wrapTxHash, trade, swapResult, orderDetails, expectedTitle) => {
      mocked(useUniswapXOrderByOrderHash).mockReturnValue(orderDetails)
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
