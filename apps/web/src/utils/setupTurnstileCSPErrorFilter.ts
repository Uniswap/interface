/**
 * Suppresses CSP violation console errors from Cloudflare Turnstile iframes.
 *
 * These errors originate from inside Cloudflare's iframe and cannot be controlled
 * from our application. They clutter the console but don't affect functionality.
 *
 * CSP violations can be reported via:
 * 1. console.error (intercepted here)
 * 2. SecurityPolicyViolationEvent (listened to here)
 */
export function setupTurnstileCSPErrorFilter(): void {
  // Store the original console.error
  // biome-ignore lint/suspicious/noConsole: Required to override console.error for filtering
  const originalError = console.error

  /**
   * Checks if an error string or URI is related to Turnstile CSP violations
   */
  function isTurnstileCSPError(text: string): boolean {
    const lowerText = text.toLowerCase()

    // Check for CSP violation indicators
    const hasCSPViolationIndicator =
      lowerText.includes("note that 'script-src' was not explicitly set") ||
      lowerText.includes("so 'default-src' is used as a fallback") ||
      lowerText.includes('refused to execute inline script') ||
      lowerText.includes('violates the following content security policy') ||
      lowerText.includes('content security policy')

    // Check for Turnstile-related identifiers
    const hasTurnstileIdentifier =
      lowerText.includes('challenges.cloudflare.com') ||
      lowerText.includes('cdn-cgi/challenge-platform') ||
      lowerText.includes('turnstile') ||
      lowerText.includes('normal?lang=auto') ||
      lowerText.includes('/turnstile/') ||
      lowerText.includes('cf-turnstile')

    return hasCSPViolationIndicator && hasTurnstileIdentifier
  }

  // Override console.error to filter out Turnstile CSP errors
  console.error = (...args: unknown[]): void => {
    // Convert all arguments to string for pattern matching
    const errorString = args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg
        }
        if (arg instanceof Error) {
          return arg.message || String(arg)
        }
        return String(arg)
      })
      .join(' ')

    // Suppress only CSP errors from Turnstile
    if (isTurnstileCSPError(errorString)) {
      return
    }

    // Call original console.error for all other errors
    originalError.apply(console, args)
  }

  // Listen for SecurityPolicyViolationEvent (CSP violations reported via events)
  // This must be set up before any Turnstile scripts load, which is why it's in sideEffects
  if (typeof window !== 'undefined') {
    window.addEventListener(
      'securitypolicyviolation',
      (event: SecurityPolicyViolationEvent) => {
        // Check if this violation is from Turnstile
        const blockedURI = event.blockedURI || ''
        const violatedDirective = event.violatedDirective || ''
        const sourceFile = event.sourceFile || ''

        // Build a string to check against our pattern matcher
        const violationInfo = [blockedURI, violatedDirective, sourceFile, event.originalPolicy || ''].join(' ')

        if (isTurnstileCSPError(violationInfo)) {
          // Prevent the default behavior (which would log to console)
          event.preventDefault()
          // Silently ignore - these are expected and cannot be fixed from our side
          return
        }
      },
      { passive: false },
    )
  }
}
