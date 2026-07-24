import { createTestSessionContext } from '@universe/sessions/src/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createExperimentsClient } from './client'
import { requestMockScenario } from './mock'

/**
 * Live integration test for the `x-experiments` transport against a real
 * dev/staging notification service. Proves the full chain end to end: the
 * header this package produces → gateway → EGW (`x-experiments` →
 * `x-common-data`) → `mockScenarioInterceptor` → the backend's registered
 * canned response.
 *
 * Opt-in only: skipped unless INTEGRATION_TEST_MOCK_SCENARIO is set, so
 * default CI never makes a network call. Run against staging with:
 *
 *   INTEGRATION_TEST_MOCK_SCENARIO=true \
 *   bun nx run @universe/experiments:test mock.integration
 *
 * Requires the notification-service mock interceptor to be deployed (see
 * Uniswap/backend `notification-service/src/integrationMocks.ts`).
 *
 * The scenario name mirrors the backend's `GET_NOTIFICATIONS_MOCK_SCENARIO`
 * constant — keep them in sync.
 */
const SCENARIO = 'notification.getNotifications.canned'
const MOCK_NOTIFICATION_ID = 'mock:notification-service'

const backendUrl = process.env.INTEGRATION_BACKEND_URL ?? 'https://entry-gateway.backend-staging.api.uniswap.org'

const enabled = Boolean(process.env.INTEGRATION_TEST_MOCK_SCENARIO)

describe.runIf(enabled)('x-experiments live integration (notification service)', () => {
  let session: Awaited<ReturnType<typeof createTestSessionContext>>

  beforeAll(async () => {
    session = await createTestSessionContext({ platform: 'extension', backendUrl })
  }, 30_000)

  afterAll(async () => {
    await session.cleanup()
  })

  it('returns the backend canned response when the mock directive rides x-experiments', async () => {
    const client = createExperimentsClient()
    requestMockScenario({ scenario: SCENARIO }, client)

    const sessionHeaders = await session.getSessionHeaders()
    const response = await fetch(`${backendUrl}/uniswap.notificationservice.v1.NotificationService/GetNotifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...sessionHeaders,
        ...client.toHeaders(),
      },
      body: JSON.stringify({}),
    })

    expect(response.ok).toBe(true)
    const body = (await response.json()) as { notifications?: Array<{ id?: string }> }
    // The canned response returns a single notification with a sentinel ID.
    // This proves the mock interceptor fired — real notifications never have this ID.
    expect(body.notifications).toHaveLength(1)
    expect(body.notifications?.[0]?.id).toBe(MOCK_NOTIFICATION_ID)
  }, 15_000)
})
