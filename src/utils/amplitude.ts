import { init } from '@amplitude/analytics-browser'

const API_KEY = 'placeholder'

// Option 1, initialize with API_KEY only
init(API_KEY)

// Option 2, initialize including user ID if it's already known
init(API_KEY, 'user@amplitude.com')

// Option 2, initialize including configuration
init(API_KEY, 'user@amplitude.com', {
  disableCookies: true, // Disables the use of browser cookies
  // More configuration available below.
})
