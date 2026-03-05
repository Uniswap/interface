import { datadogRum } from '@datadog/browser-rum'
import { FetchError, is401Error } from '@universe/api'
import { AppTFunction } from 'ui/src/i18n/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { isWebApp } from 'utilities/src/platform'

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
  stepIndex?: number
  isBackendRejection: boolean
  originalError?: Error

  originalErrorStringified?: string
  originalErrorString?: string // originalErrorStringified error may get cut off by size limits; this acts as minimal backup
  stepStringified?: string

  isPlanStep?: boolean

  constructor({
    message,
    step,
    isBackendRejection = false,
    originalError,
    isPlanStep = false,
  }: {
    message: string
    step: TransactionStep & { stepIndex?: number }
    isBackendRejection?: boolean
    originalError?: Error
    isPlanStep?: boolean
  }) {
    super(message, { cause: originalError })
    this.name = 'TransactionStepFailedError'
    this.step = step
    this.stepIndex = step.stepIndex
    this.isBackendRejection = isBackendRejection
    this.originalError = originalError
    this.isPlanStep = isPlanStep

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
        fingerprint.push(String(this.originalError.code))
      }

      if (this.originalError?.message) {
        fingerprint.push(String(this.originalError.message))
      }

      if (this.isBackendRejection && this.originalError instanceof FetchError && this.originalError.data?.detail) {
        fingerprint.push(String(this.originalError.data.detail))
      }
    } catch (e) {
      if (isWebApp) {
        datadogRum.addAction('Transaction Action', {
          message: `problem determining fingerprint for ${this.step.type}`,
          level: 'info',
          step: this.step.type,
          data: {
            errorMessage: e instanceof Error ? e.message : undefined,
          },
        })
      }
    }

    return fingerprint
  }
}

export class JupiterExecuteError extends TransactionError {
  code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = 'JupiterExecuteError'
    this.code = code
  }
}

export class ApprovalEditedInWalletError extends TransactionStepFailedError {
  logError = false

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

function isSessionError(error: Error): boolean {
  let e: unknown | undefined = error

  while (e && !(e instanceof FetchError)) {
    if (e instanceof TransactionStepFailedError) {
      e = e.originalError
    } else if (e instanceof Error) {
      e = e.cause
    }
  }

  return is401Error(e)
}

export function getErrorContent(
  t: AppTFunction,
  error: Error,
): {
  title: string
  buttonText?: string
  message: string
  supportArticleURL?: string
} {
  if (isSessionError(error)) {
    return {
      title: t('common.session.fail.title'),
      message: isWebApp ? t('common.session.fail.browser') : t('common.session.fail'),
    }
  }

  if (error instanceof TransactionStepFailedError) {
    return getStepSpecificErrorContent(t, error)
  }

  if (error instanceof JupiterExecuteError) {
    return getJupiterExecuteErrorContent(t, error.code)
  }

  // Generic / default error
  return {
    title: t('common.unknownError.error'),
    message: t('common.swap.failed'),
  }
}

function getJupiterExecuteErrorContent(
  t: AppTFunction,
  code: number,
): {
  title: string
  message: string
  supportArticleURL?: string
} {
  const errorContent = {
    title: t('common.swap.failed'),
    message: t('error.jupiterApi.execute.default.title'),
    supportArticleURL: uniswapUrls.helpArticleUrls.jupiterApiError,
  }

  switch (code) {
    case -1:
      errorContent.message += ' ' + t('error.jupiterApi.missingCachedOrder')
      return errorContent
    case -2:
      errorContent.message += ' ' + t('error.jupiterApi.invalidSignedTransaction')
      return errorContent
    case -3:
      errorContent.message += ' ' + t('error.jupiterApi.invalidMessageBytes')
      return errorContent
    case -1000:
    case -2000:
      errorContent.message += ' ' + t('error.jupiterApi.failedToLand', { code })
      return errorContent
    case -2002:
      errorContent.message += ' ' + t('error.jupiterApi.invalidPayload')
      return errorContent
    case -2003:
      errorContent.title = t('transaction.status.swap.expired')
      errorContent.message = t('error.jupiterApi.quoteExpired')
      return errorContent
    case -1002:
      errorContent.message += ' ' + t('error.jupiterApi.invalidTransaction')
      return errorContent
    case -1003:
      errorContent.message += ' ' + t('error.jupiterApi.notFullySigned')
      return errorContent
    case -1004:
      errorContent.message += ' ' + t('error.jupiterApi.invalidBlockHeight')
      return errorContent
    default:
      // Fallback for unmapped codes
      errorContent.message += ' ' + t('error.jupiterApi.unknownErrorCode', { code })
      return errorContent
  }
}

function getStepSpecificErrorContent(
  t: AppTFunction,
  error: TransactionStepFailedError,
): {
  title: string
  buttonText?: string
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
        message: error.isPlanStep ? t('swap.fail.message.plan') : t('swap.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.transactionFailure,
      }
    case TransactionStepType.SwapTransactionBatched: {
      // Only show batched-specific retry UI if the first step failed;
      // Handles scenarios where plan cannot disable one-click swap beyond first step.
      const shouldDisableOneClickSwap = !error.stepIndex || error.stepIndex === 0

      if (shouldDisableOneClickSwap) {
        return {
          title: t('swap.fail.batched.title'),
          buttonText: t('swap.fail.batched.retry'),
          message: t('swap.fail.batched'),
          supportArticleURL: uniswapUrls.helpArticleUrls.transactionFailure,
        }
      }
      // Fall through to generic swap error
      return {
        title: t('common.swap.failed'),
        message: error.isPlanStep ? t('swap.fail.message.plan') : t('swap.fail.message'),
        supportArticleURL: uniswapUrls.helpArticleUrls.transactionFailure,
      }
    }
    case TransactionStepType.UniswapXSignature:
    case TransactionStepType.UniswapXPlanSignature:
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
        message: t('error.tokenApproval.message'),
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
