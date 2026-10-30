import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { ONE_DAY_MS, ONE_HOUR_MS } from 'utilities/src/time/time'

const address = '0x123'
const now = 1_800_000_000_000

const forTx = ({
  id,
  status,
  addedTime,
  type = TransactionType.OffRampSale,
}: {
  id: string
  status: TransactionStatus
  addedTime: number
  type?: TransactionType.OffRampSale | TransactionType.OnRampPurchase
}): TransactionDetails => ({
  id,
  chainId: UniverseChainId.Mainnet,
  from: address,
  status,
  hash: '',
  routing: TradingApi.Routing.CLASSIC,
  options: { request: {} },
  addedTime,
  transactionOriginType: TransactionOriginType.Internal,
  typeInfo: {
    type,
    id,
    destinationTokenSymbol: 'ETH',
    destinationTokenAddress: '0x0',
    serviceProvider: { id: 'MOONPAY', name: 'MoonPay', url: '', logoLightUrl: '', logoDarkUrl: '' },
    sourceCurrency: 'USD',
  },
})

function selectIds(txs: TransactionDetails[]): string[] | undefined {
  const state = {
    transactions: { [address]: { [UniverseChainId.Mainnet]: Object.fromEntries(txs.map((tx) => [tx.id, tx])) } },
  } as unknown as UniswapState
  return makeSelectAddressTransactions()(state, { evmAddress: address, svmAddress: null })?.map((tx) => tx.id)
}

describe('makeSelectAddressTransactions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides pending off-ramp sales older than a day', () => {
    const ids = selectIds([
      forTx({ id: 'stale', status: TransactionStatus.Pending, addedTime: now - ONE_DAY_MS - ONE_HOUR_MS }),
      forTx({ id: 'recent', status: TransactionStatus.Pending, addedTime: now - ONE_HOUR_MS }),
    ])

    expect(ids).toEqual(['recent'])
  })

  it('keeps pending on-ramp purchases for 10 days to cover bank-rail settlement', () => {
    const onRampPurchase = TransactionType.OnRampPurchase
    const ids = selectIds([
      forTx({ id: 'stale', status: TransactionStatus.Pending, addedTime: now - 11 * ONE_DAY_MS, type: onRampPurchase }),
      forTx({ id: 'ach', status: TransactionStatus.Pending, addedTime: now - 4 * ONE_DAY_MS, type: onRampPurchase }),
    ])

    expect(ids).toEqual(['ach'])
  })

  it('keeps finalized FOR transactions regardless of age', () => {
    const ids = selectIds([
      forTx({ id: 'old-success', status: TransactionStatus.Success, addedTime: now - 30 * ONE_DAY_MS }),
      forTx({ id: 'old-failed', status: TransactionStatus.Failed, addedTime: now - 30 * ONE_DAY_MS }),
    ])

    expect(ids).toEqual(['old-success', 'old-failed'])
  })
})
