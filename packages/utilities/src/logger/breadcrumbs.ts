import { addBreadcrumb } from '@sentry/core'
import dayjs from 'dayjs'

const CONTEXT_BREADCRUMB_CATEGORY = 'react.context'
const CONTEXT_BREADCRUMB_TYPE = 'info'

export function addSentryContextBreadcrumb(contextName: string, newState: unknown): void {
  addBreadcrumb({
    category: CONTEXT_BREADCRUMB_CATEGORY,
    data: {
      contextName,
      newState,
    },
    type: CONTEXT_BREADCRUMB_TYPE,
    timestamp: dayjs().valueOf(),
  })
}
