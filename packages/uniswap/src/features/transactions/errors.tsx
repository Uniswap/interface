import { AppTFunction } from 'ui/src/i18n/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import {
  TokenApprovalTransactionStep,
  TokenRevocationTransactionStep,
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/swap/types/steps'
import { Sentry } from 'utilities/src/logger/Sentry'
import { OverridesSentryFingerprint } from 'utilities/src/logger/types'

/** Superclass used to differentiate categorized/known transaction errors from generic/unknown errors. */
export abstract class TransactionError extends Error {
  logToSentry = true
}

/** Thrown in code paths that should be unreachable, serving both typechecking and critical alarm purposes. */
export class UnexpectedTransactionStateError extends TransactionError {
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedTransactionStateError'
  }
}

/** Thrown when a transaction step fails for an unknown reason. */
export class TransactionStepFailedError extends TransactionError implements OverridesSentryFingerprint {
  step: TransactionStep
  isBackendRejection: boolean
  originalError?: Error

  // string fields for Sentry
  originalErrorStringified?: string
  originalErrorString?: string // originalErrorStringified error may get cut off by sentry size limits; this acts as minimal backup
  stepStringified?: string

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

    try {
      this.originalErrorString = originalError?.toString()
      this.originalErrorStringified = JSON.stringify(originalError, null, 2)
      this.stepStringified = JSON.stringify(step, null, 2)
    } catch {}
  }

  getFingerprint(): string[] {
    const fingerprint: string[] = [this.step.type]

    try {
      if (
        this.originalError &&
        'code' in this.originalError &&
        (typeof this.originalError.code === 'string' || typeof this.originalError.code === 'number')
      ) {
        fingerprint.push(String(this.originalError?.code))
      }

      if (this.originalError?.message) {
        fingerprint.push(String(this.originalError?.message))
      }

      if (this.isBackendRejection && this.originalError instanceof FetchError && this.originalError.data?.detail) {
        fingerprint.push(String(this.originalError.data.detail))
      }
    } catch (e) {
      Sentry.addBreadCrumb({
        level: 'info',
        category: 'transaction',
        message: `problem determining fingerprint for ${this.step.type}`,
        data: {
          errorMessage: e instanceof Error ? e.message : undefined,
        },
      })
    }

    return fingerprint
  }
}

export class ApprovalEditedInWalletError extends TransactionStepFailedError {
  logToSentry = false

  constructor({ step }: { step: TokenApprovalTransactionStep | TokenRevocationTransactionStep }) {
    super({ message: 'Approval decreased to insufficient amount in wallet', step })
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
      if (error instanceof ApprovalEditedInWalletError) {
        return {
          title: t('error.tokenApprovalEdited'),
          message: t('error.tokenApprovalEdited.message'),
          supportArticleURL: uniswapUrls.helpArticleUrls.approvalsExplainer,
        }
      }
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
