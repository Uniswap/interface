import '~/test-utils/tokens/mocks'
import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { Pending } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/Pending'
import { TradeFillType } from '~/state/routing/types'
import { useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { LIMIT_ORDER_TRADE } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'
import type { LimitOrderResult } from '~/types/trade'

vi.mock('~/state/transactions/hooks', async () => {
  const actual = await vi.importActual('~/state/transactions/hooks')
  return {
    ...actual,
    useUniswapXOrderByOrderHash: vi.fn(),
    useIsTransactionConfirmed: vi.fn(),
  }
})

const uniswapXLimitOrderResult: LimitOrderResult = {
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

describe('Pending - uniswapX trade titles', () => {
  it.each([
    [false, false, undefined, LIMIT_ORDER_TRADE, uniswapXLimitOrderResult, undefined, 'Limit submitted'],
    [false, false, undefined, LIMIT_ORDER_TRADE, uniswapXLimitOrderResult, filledOrderDetails, 'Limit filled!'],
    [false, false, undefined, LIMIT_ORDER_TRADE, undefined, undefined, 'Confirm limit'],
  ])(
    'renders limit order correctly, with approvalPending= %p , revocationPending= %p, wrapTxHash= %p',
    async (approvalPending, revocationPending, wrapTxHash, trade, limitOrderResult, orderDetails, expectedTitle) => {
      mocked(useUniswapXOrderByOrderHash).mockReturnValue(orderDetails)
      const { asFragment } = render(
        <Pending
          trade={trade}
          tokenApprovalPending={approvalPending}
          revocationPending={revocationPending}
          wrapTxHash={wrapTxHash}
          limitOrderResult={limitOrderResult}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
      expect(screen.getByText(expectedTitle)).toBeInTheDocument()
    },
  )
})
