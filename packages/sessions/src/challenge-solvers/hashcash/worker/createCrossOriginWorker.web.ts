/**
 * A module worker's top-level script must be same-origin (CORS does not lift this), so
 * cross-origin CDN chunks are wrapped in a same-origin blob whose `import` follows CORS.
 * Consumers must obtain workerUrl via Vite's `?worker&url` import in app source
 * (vitejs/vite#13680).
 */
export function createCrossOriginWorker(workerUrl: string): Worker {
  const resolvedUrl = new URL(workerUrl, window.location.href)

  if (resolvedUrl.origin === window.location.origin) {
    return new Worker(resolvedUrl, { type: 'module' })
  }

  const blob = new Blob([`import ${JSON.stringify(resolvedUrl.href)}`], { type: 'text/javascript' })
  return new Worker(URL.createObjectURL(blob), { type: 'module' })
}
