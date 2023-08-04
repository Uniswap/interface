class Cache {
  async match(request: string) {
    const cache = await caches.open('function-cache')
    const response = await cache.match(request)
    if (!response) return undefined
    return JSON.parse(await response.text())
  }

  async put(
    data: {
      title: string
      image: string
      url: string
    },
    request: string
  ) {
    // Set max age to 1 week
    const response = new Response(JSON.stringify(data))
    response.headers.set('Cache-Control', 'max-age=604800')
    const cache = await caches.open('function-cache')
    await cache.put(request, response)
  }
}

export default new Cache()
