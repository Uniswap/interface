import type { MarginPositionsWireResponse } from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'

// Rows copied from the dev GET /v1/margin/positions responses for one wallet: `statuses=ACTIVE`, and
// `statuses=COMPLETED,LIQUIDATED,PARTIALLY_LIQUIDATED` (the two closed rows that share subId 0). Trimmed
// only of the fields the view does not declare (the *InDebt PnL set, depositedEquity, and a closed row's
// accruedInterest and collateralAtOpen). A position's decreases come from GET /margin/positions/activity.
export const MARGIN_POSITIONS_WIRE_ACTIVE: MarginPositionsWireResponse = {
  requestId: 'dev-active',
  positions: [
    {
      status: 'ACTIVE',
      direction: MarginDirection.LONG,
      exposureToken: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        chainId: 1,
        decimals: 18,
      },
      counterToken: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        decimals: 6,
      },
      size: '7456694769204379',
      entryPrice: '2415456561000000000000',
      openedAt: '1788149171000',
      accruedInterest: '98398',
      unrealizedPnl: '37345109191491',
      roe: '5070383694889396',
      equity: '6802686952873330',
      leverage: '1.096139631422376141',
      oraclePrice: '2393217574647039609345',
      liquidationPrice: '252895246326203066905',
      buffer: '894328351502474248',
      healthFactor: '9463276235568658646',
      borrowRate: '44809795200012592',
      maxWithdrawable: '6635901822741145',
      openTxHash: '0x99de05fd1295f962b385ef0692f277e04e97eb6c5458e27355e5dbe9a60d79f9',
      collateralAtOpen: '13730683687363677',
      subId: '1',
      venue: 'AAVE_V3',
      account: '0xDCa4deebCa94f6c281f814558a2E36CC9090d35d',
      debtAmount: '1565183',
    },
  ],
  pendingPlans: [],
}

export const MARGIN_POSITIONS_WIRE_TERMINAL: MarginPositionsWireResponse = {
  requestId: 'dev-terminal',
  positions: [
    {
      status: 'COMPLETED',
      direction: MarginDirection.LONG,
      exposureToken: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        chainId: 1,
        decimals: 18,
      },
      counterToken: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        decimals: 6,
      },
      size: '1498300147811261',
      entryPrice: '2406121000000000000000',
      openedAt: '1792171967000',
      closedAt: '1792172207000',
      exitPrice: '2417411662000000000000',
      realizedPnl: '3120109341330',
      openTxHash: '0x1707cdbe7a1954dc96249138515cb6903625b1b715f8eb196ac3eead693d6c8c',
      closeTxHash: '0x94173df3fc5ecd142d81d79b8377fa0c15c43a4a261e5133674177f23d7e0af0',
      subId: '0',
      venue: 'MORPHO',
      account: '0x2b6f7Cd15f8d09D909664a43D60215eD84f8490e',
    },
    {
      status: 'COMPLETED',
      direction: MarginDirection.LONG,
      exposureToken: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        chainId: 1,
        decimals: 18,
      },
      counterToken: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        decimals: 6,
      },
      size: '3970745052312491',
      entryPrice: '2440223437000000000000',
      openedAt: '1792080131000',
      closedAt: '1792090787000',
      exitPrice: '2444989322000000000000',
      realizedPnl: '5114071353548',
      openTxHash: '0xde13e3ee0f4ffc4309abf6192cca2ac3b0298677ee4c23cbeddb9a2072d31e03',
      closeTxHash: '0x7f2500739350ec7a867f8929572120701c58a95fbf98a4e83b1fc21426562fef',
      subId: '0',
      venue: 'AAVE_V3',
      account: '0x2b6f7Cd15f8d09D909664a43D60215eD84f8490e',
    },
  ],
  pendingPlans: [],
}
