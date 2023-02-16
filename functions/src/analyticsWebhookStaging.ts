import { flush, init, track, Types } from '@amplitude/analytics-node'
import * as functions from 'firebase-functions'
import pickAnalyticsProperties from './utils/pickAnalyticsProperties'

const initializeAnalytics = (apiKey: string): Promise<void> => {
  return init(apiKey, {
    logLevel: Types.LogLevel.Debug,
  }).promise
}

export const analyticsWebhookStaging = functions
  .runWith({
    secrets: ['AMPLITUDE_ANALYTICS_KEY_STAGING'],
  })
  .https.onRequest(async (request: functions.Request, response: functions.Response<unknown>) => {
    try {
      if (!process.env.AMPLITUDE_ANALYTICS_KEY_STAGING) {
        throw new Error('AMPLITUDE_ANALYTICS_KEY_STAGING missing')
      }
      const eventProperties = pickAnalyticsProperties(request.body.data)

      await initializeAnalytics(process.env.AMPLITUDE_ANALYTICS_KEY_STAGING ?? '')
      let eventName = 'MoonPay Transaction Updated'
      if (!eventProperties) {
        throw new Error('failed to collect event properties')
      }
      if (eventProperties.status === 'failed') {
        eventName = 'MoonPay Transaction Failed'
      }
      await track(`Staging ${eventName}`, eventProperties, {
        user_id: request.body.data.walletAddress,
      }).promise
      await flush().promise
      response.status(200)
    } catch (e) {
      console.error(e)
      response.status(500)
    } finally {
      response.end()
    }
  })
