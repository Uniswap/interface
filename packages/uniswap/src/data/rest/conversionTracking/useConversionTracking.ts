import { ConnectError } from '@connectrpc/connect'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { parse } from 'qs'
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router'
import {
  CONVERSION_LEADS_EXPIRATION_MS,
  CONVERSION_LEADS_STORAGE_KEY,
} from 'uniswap/src/data/rest/conversionTracking/constants'
import { buildProxyRequest } from 'uniswap/src/data/rest/conversionTracking/tracking'
import { ConversionLead, PlatformIdType, TrackConversionArgs } from 'uniswap/src/data/rest/conversionTracking/types'
import { useConversionProxy } from 'uniswap/src/data/rest/conversionTracking/useConversionProxy'
import { getExternalConversionLeadsCookie } from 'uniswap/src/data/rest/conversionTracking/utils'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HexString } from 'utilities/src/addresses/hex'

const conversionLeadsAtom = atomWithStorage<ConversionLead[]>(CONVERSION_LEADS_STORAGE_KEY, [])

type UseConversionTracking = {
  /**
   * trackConversions will execute each conversion event at most once per platform
   */
  trackConversions: (events: TrackConversionArgs[]) => void
  /**
   * initConversionTracking grabs the platform ids from the querystring and cookie and stores them in local storage
   */
  initConversionTracking: () => void
}

export function useConversionTracking(accountAddress?: HexString): UseConversionTracking {
  const { search } = useLocation()
  const queryParams = useMemo(() => parse(search, { ignoreQueryPrefix: true }), [search])
  const [conversionLeads, setConversionLeads] = useAtom(conversionLeadsAtom) as [
    ConversionLead[],
    Dispatch<SetStateAction<ConversionLead[]>>,
  ]
  const isConversionTrackingEnabled = useFeatureFlag(FeatureFlags.ConversionTracking)
  const isTwitterConversionTrackingEnabled = useFeatureFlag(FeatureFlags.TwitterConversionTracking)
  const isGoogleConversionTrackingEnabled = useFeatureFlag(FeatureFlags.GoogleConversionTracking)
  const conversionProxy = useConversionProxy()

  // biome-ignore lint/correctness/useExhaustiveDependencies: -conversionProxy.mutateAsync
  const trackConversion = useCallback(
    async ({ platformIdType, eventId, eventName }: TrackConversionArgs) => {
      const lead = conversionLeads.find(({ type }) => type === platformIdType)
      let setAsExecuted: boolean = false

      // Prevent triggering events under the following conditions:
      // - No corresponding lead
      // - Wallet not connected
      // - Tracking has already been fired for a given event
      // - Conversion tracking is not enabled
      // - Google or Twitter conversion tracking is not enabled
      if (
        !lead ||
        !accountAddress ||
        lead.executedEvents.includes(eventId) ||
        !isConversionTrackingEnabled ||
        (platformIdType === PlatformIdType.Google && !isGoogleConversionTrackingEnabled) ||
        (platformIdType === PlatformIdType.Twitter && !isTwitterConversionTrackingEnabled)
      ) {
        return
      }

      const proxyRequest = buildProxyRequest({ lead, address: accountAddress, eventId, eventName })

      try {
        const response = await conversionProxy.mutateAsync(proxyRequest)

        // Prevent success handler if the underlying request is bad
        if (response.status !== 200) {
          throw new Error()
        }

        setAsExecuted = true

        sendAnalyticsEvent(UniswapEventName.ConversionEventSubmitted, {
          id: lead.id,
          eventId,
          eventName,
          platformIdType,
        })
      } catch (error) {
        // Note: The request will be retried until it exists in executedEvents
        // If the event has already been executed, but doesn't exist in executedEvents, this will ensure we don't retry errors
        if (error instanceof ConnectError) {
          if (error.message.includes('limit for this (user, event)')) {
            setAsExecuted = true
          }
        }
      } finally {
        if (setAsExecuted) {
          setConversionLeads((leads: ConversionLead[]) => [
            ...leads.filter(({ id }) => lead.id !== id),
            {
              ...lead,
              executedEvents: lead.executedEvents.concat([eventId]),
            },
          ])
        }
      }
    },
    // TODO: Investigate why conversionProxy as a dependency causes a rendering loop
    [
      accountAddress,
      conversionLeads,
      isConversionTrackingEnabled,
      isGoogleConversionTrackingEnabled,
      isTwitterConversionTrackingEnabled,
      setConversionLeads,
    ],
  )

  const trackConversions = useCallback(
    (events: TrackConversionArgs[]) => events.forEach(trackConversion),
    [trackConversion],
  )

  const initConversionTracking = useCallback(() => {
    if (!isConversionTrackingEnabled) {
      return
    }

    const now = new Date().getTime()
    const newLeads: ConversionLead[] = []

    // Grab the lead from the cookie and pass it to localstorage if it exists
    const externalCookie = getExternalConversionLeadsCookie()
    if (externalCookie) {
      newLeads.push({
        id: externalCookie.value,
        type: externalCookie.key,
        timestamp: now,
        executedEvents: [],
      })
    }

    Object.values(PlatformIdType).forEach((type) => {
      const id = queryParams[type] as string
      const existingLead = conversionLeads.find((lead) => lead.id === id)

      // Since the querystring isn't changing we need to make sure we haven't already captured the lead
      if (id && !existingLead) {
        newLeads.push({
          id,
          type,
          timestamp: now,
          executedEvents: [],
        })
      }
    })

    const expiredLeadIds = conversionLeads
      .filter(({ timestamp }) => timestamp + CONVERSION_LEADS_EXPIRATION_MS < now)
      .map(({ id }) => id)

    if (newLeads.length || expiredLeadIds.length) {
      const newLeadTypes = newLeads.map(({ type }) => type)
      const activeLeads = conversionLeads.filter(
        ({ id, type }) => !expiredLeadIds.includes(id) && !newLeadTypes.includes(type),
      )

      setConversionLeads([...activeLeads, ...newLeads])
    }
  }, [conversionLeads, isConversionTrackingEnabled, queryParams, setConversionLeads])

  return { trackConversions, initConversionTracking }
}
