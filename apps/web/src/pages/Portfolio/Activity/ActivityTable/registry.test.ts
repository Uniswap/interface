import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { PlanTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

function createEarnPlanTransaction({
  earnAction,
  status = TransactionStatus.AwaitingAction,
  id = `plan-${earnAction}-${status}`,
  inputCurrencyAmountRaw = '1000000',
  outputCurrencyAmountRaw = '900000',
  planStatus,
  updatedTime = 1,
}: {
  earnAction: TradingApi.EarnAction
  id?: string
  inputCurrencyAmountRaw?: string
  outputCurrencyAmountRaw?: string
  planStatus?: TradingApi.PlanStatus
  status?: TransactionStatus
  updatedTime?: number
}): PlanTransactionDetails {
  const currencyId = buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS)

  return {
    routing: TradingApi.Routing.CHAINED,
    id,
    chainId: UniverseChainId.Mainnet,
    status,
    addedTime: 1,
    updatedTime,
    from: ADDRESS,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.Plan,
      planId: id,
      planStatus:
        planStatus ??
        (status === TransactionStatus.Success
          ? TradingApi.PlanStatus.COMPLETED
          : TradingApi.PlanStatus.AWAITING_ACTION),
      stepDetails: [],
      tokenOutChainId: UniverseChainId.Mainnet,
      inputCurrencyId: currencyId,
      outputCurrencyId: currencyId,
      inputCurrencyAmountRaw,
      outputCurrencyAmountRaw,
      tradeType: 0,
      earnAction,
      transactionHashes: [],
    },
  }
}

describe('buildActivityRowFragments', () => {
  it('shows interrupted Earn deposit plans as deposit activity', () => {
    const fragments = buildActivityRowFragments(
      createEarnPlanTransaction({ earnAction: TradingApi.EarnAction.DEPOSIT }),
    )

    expect(fragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '1000000',
    })
    expect(fragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.interrupted',
    })
  })

  it('shows interrupted Earn withdraw plans as withdraw activity', () => {
    const fragments = buildActivityRowFragments(
      createEarnPlanTransaction({ earnAction: TradingApi.EarnAction.WITHDRAW }),
    )

    expect(fragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '900000',
    })
    expect(fragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Receives,
      overrideLabelKey: 'transaction.status.withdraw.interrupted',
    })
  })

  it('falls back to generic plan fragments when Earn activity display is disabled', () => {
    const fragments = buildActivityRowFragments(
      createEarnPlanTransaction({ earnAction: TradingApi.EarnAction.DEPOSIT }),
      { isEarnActivityDisplayEnabled: false },
    )

    const currencyId = buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS)
    expect(fragments.amount).toEqual({
      kind: 'pair',
      inputCurrencyId: currencyId,
      outputCurrencyId: currencyId,
      inputAmountRaw: '1000000',
      outputAmountRaw: '900000',
    })
    expect(fragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Swaps,
      overrideLabelKey: 'transaction.status.plan.interruptedShort',
    })
  })

  it('does not reuse cached Earn fragments after the display gate changes', () => {
    const id = 'plan-cache-display-gate'
    const earnFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
      }),
      { isEarnActivityDisplayEnabled: true },
    )
    const genericFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
      }),
      { isEarnActivityDisplayEnabled: false },
    )

    expect(earnFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.interrupted',
    })
    expect(genericFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Swaps,
      overrideLabelKey: 'transaction.status.plan.interruptedShort',
    })
  })

  it('does not reuse cached Earn plan fragments after amount updates', () => {
    const id = 'plan-cache-key'
    const originalFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
      }),
    )
    const updatedFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        inputCurrencyAmountRaw: '2000000',
      }),
    )

    expect(originalFragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '1000000',
    })
    expect(updatedFragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '2000000',
    })
  })

  it('does not reuse cached Earn plan fragments after status updates', () => {
    const id = 'plan-cache-status'
    const planStatus = TradingApi.PlanStatus.AWAITING_ACTION
    const originalFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        planStatus,
      }),
    )
    const updatedFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        planStatus,
        status: TransactionStatus.Success,
      }),
    )

    expect(originalFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.interrupted',
    })
    expect(updatedFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.success',
    })
  })
})
