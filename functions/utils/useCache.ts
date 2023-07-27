export async function getCache(request: string, name: string) {
  const cache = await caches.open(name)
  const response = await cache.match(request)
  if (response) {
    const data = JSON.parse(await response.text())
    return data
  }
  return undefined
}

export async function putCache(response: Response, request: string, name: string) {
  response.headers.set('Cache-Control', 'max-age=3600')
  const cache = await caches.open(name)
  await cache.put(request, response)
}
