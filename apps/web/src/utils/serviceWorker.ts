import { logger } from 'utilities/src/logger/logger'

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        logger.error(error, {
          tags: {
            file: 'serviceWorker',
            function: 'unregister',
          },
        })
      })
  }
}
