import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'

// Declare Turnstile types inline to avoid import issues
interface TurnstileWidget {
  render: (container: string | HTMLElement, options: TurnstileOptions) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
  getResponse: (widgetId: string) => string | undefined
  ready: (callback: () => void) => void
}

interface TurnstileOptions {
  sitekey: string
  action?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  callback?: (token: string) => void
  'error-callback'?: (error: string) => void
  'expired-callback'?: () => void
}

// Extend the Window interface to include turnstile
declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

/**
 * Creates a Turnstile challenge solver.
 *
 * This integrates with Cloudflare Turnstile using explicit rendering:
 * - Dynamically loads Turnstile script if not present
 * - Creates a temporary DOM container
 * - Renders widget with sitekey and action from challengeData.extra
 * - Returns the verification token from Turnstile API
 */
function createTurnstileSolver(): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    // Parse challenge data from server
    const challengeDataStr = challengeData.extra?.challengeData
    if (!challengeDataStr) {
      throw new Error('Missing challengeData in challenge extra')
    }

    let parsedData: { siteKey: string; action: string }
    try {
      parsedData = JSON.parse(challengeDataStr)
    } catch (error) {
      throw new Error('Failed to parse challengeData', { cause: error })
    }

    const { siteKey, action } = parsedData
    if (!siteKey) {
      throw new Error('Missing siteKey in challengeData')
    }

    // Ensure Turnstile script is loaded
    await loadTurnstileScript()

    // Create temporary container for the widget
    const containerId = `turnstile-${challengeData.challengeId}`
    const container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.top = '-9999px' // Hide off-screen
    container.style.left = '-9999px'
    document.body.appendChild(container)

    try {
      // Wait for Turnstile to be ready and render widget
      const token = await new Promise<string>((resolve, reject) => {
        if (!window.turnstile) {
          reject(new Error('Turnstile API not available'))
          return
        }

        window.turnstile.ready(() => {
          if (!window.turnstile) {
            reject(new Error('Turnstile API not available after ready'))
            return
          }

          window.turnstile.render(container, {
            sitekey: siteKey,
            action,
            theme: 'light',
            size: 'normal',
            callback: (tokenValue: string) => {
              resolve(tokenValue)
            },
            'error-callback': (error: string) => {
              reject(new Error(`Turnstile error: ${error}`))
            },
            'expired-callback': () => {
              reject(new Error('Turnstile token expired'))
            },
          })

          // Set timeout to prevent hanging
          setTimeout(() => {
            reject(new Error('Turnstile challenge timeout'))
          }, 30000) // 30 second timeout
        })
      })

      return token
    } finally {
      // Clean up: remove the container
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }

  return { solve }
}

/**
 * Dynamically loads the Turnstile script if not already present
 */
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Turnstile is already loaded
    if (window.turnstile) {
      resolve()
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
    if (existingScript) {
      // Script exists, wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded)
        reject(new Error('Turnstile script load timeout'))
      }, 10000)
      return
    }

    // Create and inject the script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true

    script.onload = (): void => {
      // Wait for turnstile to actually be available on window
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Turnstile did not initialize after script load'))
      }, 5000)
    }

    script.onerror = (): void => reject(new Error('Failed to load Turnstile script'))

    document.head.appendChild(script)
  })
}

export { createTurnstileSolver }
