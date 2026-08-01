import { useQuery } from '@tanstack/react-query'
import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { bootstrapSession } from '@universe/api/src/session/provideSession'
import type { SessionInitializationService } from '@universe/sessions'
import { SESSION_INIT_QUERY_KEY, sessionInitQuery } from '@universe/sessions'
import { useState } from 'react'
import type { Logger } from 'utilities/src/logger/logger'

interface ApiInitProps {
  getSessionInitService: () => SessionInitializationService
  isSessionServiceEnabled: boolean
  getLogger?: () => Logger
}

function ApiInit({ getSessionInitService, isSessionServiceEnabled, getLogger }: ApiInitProps): null {
  const [query] = useState(() => {
    // Both calls only build the query *options* (cheap, idempotent). The fetch
    // itself runs once: the `useQuery` below and the gate's `fetchQuery` share
    // the same query key, so React Query dedupes the actual request.
    bootstrapSession({ getService: getSessionInitService, getLogger })
    return sessionInitQuery({ getService: getSessionInitService, getLogger })
  })

  useQuery({ ...query, enabled: isSessionServiceEnabled })

  return null
}

export async function reinitializeSession(): Promise<void> {
  await SharedQueryClient.invalidateQueries({ queryKey: SESSION_INIT_QUERY_KEY })
}

export { ApiInit }
export type { ApiInitProps }
