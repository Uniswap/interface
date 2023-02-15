import { flush, init, track, Types } from '@amplitude/analytics-node'
import * as functions from 'firebase-functions'
import pickAnalyticsProperties from './utils/pickAnalyticsProperties'

const initializeAnalytics = (apiKey: string) => {
  return init(apiKey, {
    logLevel: Types.LogLevel.Warn,
  }).promise
}

export const analyticsWebhook = functions
  .runWith({
    secrets: ['AMPLITUDE_ANALYTICS_KEY'],
  })
  .https.onRequest(async (request: functions.Request, response: functions.Response<unknown>) => {
    try {
      if (!process.env.AMPLITUDE_ANALYTICS_KEY) {
        throw new Error('AMPLITUDE_ANALYTICS_KEY missing')
      }
      const eventProperties = pickAnalyticsProperties(request.body.data)

      await initializeAnalytics(process.env.AMPLITUDE_ANALYTICS_KEY ?? '')
      let eventName = 'MoonPay Transaction Updated'
      if (!eventProperties) {
        throw new Error('failed to collect event properties')
      }
      if (eventProperties.type === 'transaction_created') {
        eventName = 'MoonPay Transaction Created'
      }
      if (eventProperties.type === 'transaction_failed') {
        eventName = 'MoonPay Transaction Failed'
      }
      await track(eventName, eventProperties, {
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
