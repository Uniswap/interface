class Cache {
  async match(request: string, name: string) {
    const cache = await caches.open(name)
    const response = await cache.match(request)
    if (!response) return undefined
    return JSON.parse(await response.text())
  }

  async put(response: Response, request: string, name: string) {
    //Set max age to 1 week
    response.headers.set('Cache-Control', 'max-age=604800')
    const cache = await caches.open(name)
    await cache.put(request, response)
  }
}

export default new Cache()
