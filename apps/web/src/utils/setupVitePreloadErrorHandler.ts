export function setupVitePreloadErrorHandler(): void {
  window.addEventListener('vite:preloadError', (event: Event) => {
    // Prevent Vite from throwing the error and crashing the app
    event.preventDefault()

    // eslint-disable-next-line no-console
    console.error('Vite preload error: Dynamic import failed to load')

    // TODO(INFRA-546): Add retry logic in the future if needed
  })
}
