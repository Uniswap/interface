/***
 * Logs a timing for every fetch triggered by a logged timing (by monkey-patching window).
 */

import { errorOn5xx, wrap } from '..'

const windowFetch = window.fetch
window.fetch = function LoggingAwareFetch(input, init) {
  const url = typeof input === 'string' ? input : (input as Request).url
  return wrap(url, () => windowFetch(input, init), {
    squelch: true,
    data: { url },
    onResult: errorOn5xx,
  })
}
