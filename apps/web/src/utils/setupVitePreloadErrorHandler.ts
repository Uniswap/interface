export function setupVitePreloadErrorHandler(): void {
  window.addEventListener('vite:preloadError', (event: Event) => {
    // Prevent Vite from throwing the error and crashing the app
    event.preventDefault()

    // biome-ignore lint/suspicious/noConsole: Error handler needs console for debugging preload issues
    console.error('Vite preload error: Dynamic import failed to load')
  })
}
