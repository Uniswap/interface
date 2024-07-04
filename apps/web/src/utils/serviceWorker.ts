import { logger } from 'utilities/src/logger/logger'

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        logger.warn('serviceWorker', 'unregister', 'Service worker unregister failed', error)
      })
  }
}
