// TODO(gouda): delete this file
import { TradeType } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'

import { TransactionType } from '../transactions/types'
import { DutchLimitOrderStatus, SignatureDetails, SignatureType, UniswapXOrderDetails } from './types'

const swapInfo: UniswapXOrderDetails['swapInfo'] = {
  type: TransactionType.SWAP,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyAmountRaw: (5 * 10e6).toString(),
  expectedOutputCurrencyAmountRaw: (5 * 10e18).toString(),
  minimumOutputCurrencyAmountRaw: (5 * 10e18).toString(),
  inputCurrencyId: USDC_MAINNET.address,
  outputCurrencyId: DAI.address,
  isUniswapXOrder: true,
}

export function createFakeGoudaOrders(account: string) {
  const PENDING: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x1',
    status: DutchLimitOrderStatus.OPEN,
    id: '0x1',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  const ERRORED: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x2',
    status: DutchLimitOrderStatus.ERROR,
    id: '0x2',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  const EXPIRED: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x3',
    status: DutchLimitOrderStatus.EXPIRED,
    id: '0x3',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  const CANCELLED: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x4',
    status: DutchLimitOrderStatus.CANCELLED,
    id: '0x4',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  const INSUFFICIENT_FUNDS: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x5',
    status: DutchLimitOrderStatus.INSUFFICIENT_FUNDS,
    id: '0x5',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  const FILLED: SignatureDetails = {
    type: SignatureType.SIGN_UNISWAPX_ORDER,
    orderHash: '0x6',
    status: DutchLimitOrderStatus.FILLED,
    id: '0x6',
    addedTime: 1684784800000,
    chainId: 1,
    expiry: 1629780000,
    offerer: account,
    swapInfo,
  }

  return {
    [account]: {
      [PENDING.id]: PENDING,
      [ERRORED.id]: ERRORED,
      [EXPIRED.id]: EXPIRED,
      [CANCELLED.id]: CANCELLED,
      [INSUFFICIENT_FUNDS.id]: INSUFFICIENT_FUNDS,
      [FILLED.id]: FILLED,
    },
  }
}
