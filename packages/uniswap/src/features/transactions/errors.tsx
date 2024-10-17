import { AppTFunction } from 'ui/src/i18n/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'

/** Superclass used to differentiate categorized/known transaction errors from generic/unknown errors. */
export abstract class TransactionError extends Error {}

/** Thrown in code paths that should be unreachable, serving both typechecking and critical alarm purposes. */
export class UnexpectedTransactionStateError extends TransactionError {
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedTransactionStateError'
  }
}

/** Thrown when a transaction step fails for an unknown reason. */
export class TransactionStepFailedError extends TransactionError {
  step: TransactionStep
  isBackendRejection: boolean
  originalError?: Error

  constructor({
    message,
    step,
    isBackendRejection = false,
    originalError,
  }: {
    message: string
    step: TransactionStep
    isBackendRejection?: boolean
    originalError?: Error
  }) {
    super(message)
    this.name = 'TransactionStepFailedError'
    this.step = step
    this.isBackendRejection = isBackendRejection
    this.originalError = originalError
  }
}

/** Thrown when a transaction flow is interrupted by a known circumstance; should be handled gracefully in UI */
export class HandledTransactionInterrupt extends TransactionError {
  constructor(message: string) {
    super(message)
    this.name = 'HandledTransactionInterrupt'
  }
}

export function getErrorContent(
  t: AppTFunction,
  error: Error,
): {
  title: string
  message: string
  supportArticleURL?: string
} {
  if (error instanceof TransactionStepFailedError) {
    return getStepSpecificErrorContent(t, error)
  }

  // Generic / default error
  return {
    title: t('common.unknownError.error'),
    message: t('common.swap.failed'),
  }
}

function getStepSpecificErrorContent(
  t: AppTFunction,
  error: TransactionStepFailedError,
): {
  title: string
  message: string
  supportArticleURL?: string
} {
  switch (error.step.type) {
    case TransactionStepType.WrapTransaction:
      return {
        title: t('common.wrap.failed'),
        message: t('token.wrap.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.wethExplainer,
      }
    case TransactionStepType.SwapTransaction:
    case TransactionStepType.SwapTransactionAsync:
      return {
        title: t('common.swap.failed'),
        message: t('swap.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.transactionFailure,
      }
    case TransactionStepType.UniswapXSignature:
      if (error.isBackendRejection) {
        return {
          title: t('common.swap.failed'),
          message: t('swap.fail.uniswapX'),
          supportArticleURL: uniswapUrls.helpArticleUrls.uniswapXFailure,
        }
      }
      return {
        title: t('common.swap.failed'),
        message: t('swap.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.uniswapXFailure,
      }
    case TransactionStepType.Permit2Signature:
      return {
        title: t('permit.approval.fail'),
        message: t('permit.approval.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.approvalsExplainer,
      }
    case TransactionStepType.TokenApprovalTransaction:
      return {
        title: t('error.tokenApproval'),
        message: t('error.access.expiry'),
        supportArticleURL: uniswapUrls.helpArticleUrls.approvalsExplainer,
      }
    case TransactionStepType.TokenRevocationTransaction:
      return {
        title: t('common.revoke.approval.failed'),
        message: t('revoke.failed.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.revokeExplainer,
      }
    default:
      return {
        title: t('common.unknownError.error'),
        message: t('common.swap.failed'),
      }
  }
}
