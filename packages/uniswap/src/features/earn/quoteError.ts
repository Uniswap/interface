import { FetchError, TradingApi } from '@universe/api'

// Dynamic quote-error keys; keep these literal t() calls visible to i18next-parser.
// t('explore.earn.deposit.noRoutes') t('explore.earn.withdraw.noRoutes') t('explore.earn.review.quoteError')

// Routing-service no-route responses are not modeled in the generated TradingApi error enum.
const NO_QUOTES_AVAILABLE_DETAIL = 'No quotes available'
const ROUTING_NO_ROUTE_ERROR_CODE = 'NO_ROUTE'

function getStringField(data: unknown, field: string): string | undefined {
  if (!data || typeof data !== 'object' || !(field in data)) {
    return undefined
  }

  const value = (data as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

export function isEarnNoRoutesQuoteError(error: unknown): boolean {
  if (!(error instanceof FetchError)) {
    return false
  }

  const errorCode = getStringField(error.data, 'errorCode')
  const detail = getStringField(error.data, 'detail')

  return (
    errorCode === ROUTING_NO_ROUTE_ERROR_CODE ||
    errorCode === TradingApi.Err404.errorCode.RESOURCE_NOT_FOUND ||
    errorCode === TradingApi.Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR ||
    detail === NO_QUOTES_AVAILABLE_DETAIL
  )
}
