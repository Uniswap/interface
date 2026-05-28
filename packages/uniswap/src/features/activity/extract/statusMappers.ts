import {
  PlanStatus as DataApiPlanStatus,
  PlanStepStatus as DataApiPlanStepStatus,
  SwapType,
} from '@uniswap/client-data-api/dist/data/v1/plan_pb'
import { PlanActivity } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

export function mapDAPIPlanStatusToTXStatus(status: DataApiPlanStatus | undefined): TransactionStatus {
  switch (status) {
    case DataApiPlanStatus.FAILED:
      return TransactionStatus.Failed
    case DataApiPlanStatus.AWAITING_ACTION:
      return TransactionStatus.AwaitingAction
    case DataApiPlanStatus.ACTIVE:
    case DataApiPlanStatus.IN_PROGRESS:
      return TransactionStatus.Pending
    case DataApiPlanStatus.COMPLETED:
      return TransactionStatus.Success
    default:
      return TransactionStatus.Unknown
  }
}

export function mapDAPIPlanStepStatusToTXStatus(status: DataApiPlanStepStatus | undefined): TransactionStatus {
  switch (status) {
    case DataApiPlanStepStatus.ERROR:
      return TransactionStatus.Failed
    case DataApiPlanStepStatus.NOT_READY:
      return TransactionStatus.Queued
    case DataApiPlanStepStatus.AWAITING_ACTION:
      return TransactionStatus.AwaitingAction
    case DataApiPlanStepStatus.IN_PROGRESS:
      return TransactionStatus.Pending
    case DataApiPlanStepStatus.COMPLETE:
      return TransactionStatus.Success
    default:
      return TransactionStatus.Unknown
  }
}

export function mapDAPIPlanStatusToTAPIPlanStatus(status: DataApiPlanStatus): TradingApi.PlanStatus | undefined {
  switch (status) {
    case DataApiPlanStatus.FAILED:
      return TradingApi.PlanStatus.FAILED
    case DataApiPlanStatus.AWAITING_ACTION:
      return TradingApi.PlanStatus.AWAITING_ACTION
    case DataApiPlanStatus.ACTIVE:
      return TradingApi.PlanStatus.ACTIVE
    case DataApiPlanStatus.IN_PROGRESS:
      return TradingApi.PlanStatus.IN_PROGRESS
    case DataApiPlanStatus.COMPLETED:
      return TradingApi.PlanStatus.COMPLETED
    default:
      return undefined
  }
}

export function mapTAPIPlanStatusToTXStatus(planStatus: TradingApi.PlanStatus | undefined): TransactionStatus {
  switch (planStatus) {
    case TradingApi.PlanStatus.COMPLETED:
      return TransactionStatus.Success
    case TradingApi.PlanStatus.FAILED:
      return TransactionStatus.Failed
    case TradingApi.PlanStatus.AWAITING_ACTION:
      return TransactionStatus.AwaitingAction
    case TradingApi.PlanStatus.ACTIVE:
    case TradingApi.PlanStatus.IN_PROGRESS:
      return TransactionStatus.Pending
    default:
      return TransactionStatus.Unknown
  }
}

export function mapTAPIPlanStepStatusToTXStatus(planStepStatus: TradingApi.PlanStepStatus): TransactionStatus {
  switch (planStepStatus) {
    case TradingApi.PlanStepStatus.COMPLETE:
      return TransactionStatus.Success
    case TradingApi.PlanStepStatus.STEP_ERROR:
      return TransactionStatus.Failed
    case TradingApi.PlanStepStatus.NOT_READY:
      return TransactionStatus.Queued
    case TradingApi.PlanStepStatus.AWAITING_ACTION:
      return TransactionStatus.AwaitingAction
    case TradingApi.PlanStepStatus.IN_PROGRESS:
      return TransactionStatus.Pending
    default:
      return TransactionStatus.Unknown
  }
}

export function mapDAPIPlanActivitySwapTypeToTAPIPlanStepType(
  swapType: PlanActivity['swapType'],
): TradingApi.PlanStepType | undefined {
  switch (swapType) {
    case SwapType.CLASSIC:
      return TradingApi.PlanStepType.CLASSIC
    case SwapType.DUTCH_LIMIT:
      return TradingApi.PlanStepType.DUTCH_LIMIT
    case SwapType.DUTCH_V2:
      return TradingApi.PlanStepType.DUTCH_V2
    case SwapType.DUTCH_V3:
      return TradingApi.PlanStepType.DUTCH_V3
    case SwapType.LIMIT_ORDER:
      return TradingApi.PlanStepType.LIMIT_ORDER
    case SwapType.PRIORITY:
      return TradingApi.PlanStepType.PRIORITY
    case SwapType.BRIDGE:
      return TradingApi.PlanStepType.BRIDGE
    case SwapType.WRAP:
      return TradingApi.PlanStepType.WRAP
    case SwapType.UNWRAP:
      return TradingApi.PlanStepType.UNWRAP
    case SwapType.CHAINED:
      return TradingApi.PlanStepType.CHAINED
    case SwapType.QUICKROUTE:
      return TradingApi.PlanStepType.QUICKROUTE
    case SwapType.APPROVAL_PERMIT:
      return TradingApi.PlanStepType.APPROVAL_PERMIT
    case SwapType.APPROVAL_TXN:
      return TradingApi.PlanStepType.APPROVAL_TXN
    case SwapType.RESET_APPROVAL_TXN:
      return TradingApi.PlanStepType.RESET_APPROVAL_TXN
    case SwapType.UNKNOWN:
    default:
      return undefined
  }
}
