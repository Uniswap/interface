// biome-ignore lint/style/noRestrictedImports: Playwright fixtures need direct analytics import
import { test as base } from '@playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'

type AmplitudeFixture = {
  amplitude: {
    /**
     * Waits for a specific Amplitude event to be sent and returns it.
     *
     * @param {string} eventName - The name of the event to wait for
     * @param {string[]} [requiredProperties] - Optional array of property names that must exist on the event
     * @returns {Promise<any>} The event object that was found
     */
    waitForEvent: (eventName: string, requiredProperties?: string[]) => Promise<any>
  }
}

export const test = base.extend<AmplitudeFixture>({
  async amplitude({ page }, use) {
    const events: any[] = []

    // Intercept Amplitude events
    await page.route(uniswapUrls.amplitudeProxyUrl, async (route) => {
      const request = route.request()
      const postData = request.postData()
      if (!postData) {
        return route.continue()
      }

      try {
        const { events: newEvents } = JSON.parse(postData)
        events.push(...newEvents)

        // Respond with success
        return route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 200,
            server_upload_time: Date.now(),
            payload_size_bytes: postData.length,
            events_ingested: newEvents.length,
          }),
          headers: {
            'origin-country': 'US',
          },
        })
      } catch (error) {
        console.warn('Amplitude intercept error:', error)
        return route.continue()
      }
    })

    const waitForEvent = async (eventName: string, requiredProperties?: string[]) => {
      return new Promise((resolve) => {
        const checkEvents = () => {
          const targetEventIndex = events.findIndex((event) => {
            if (event.event_type !== eventName) {
              return false
            }
            if (requiredProperties) {
              return requiredProperties.every((prop) => event.event_properties[prop])
            }
            return true
          })

          if (targetEventIndex !== -1) {
            const event = events[targetEventIndex]
            // Remove the event and all previous events from the cache
            events.splice(0, targetEventIndex + 1)
            resolve(event)
          } else {
            // If not found, check again after a short delay
            setTimeout(checkEvents, 100)
          }
        }

        checkEvents()
      })
    }

    await use({ waitForEvent })
  },
})
