const clone = require('clone')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const cacheIdentifierForPayload = require('./cache-utils').cacheIdentifierForPayload

module.exports = createInflightCache


function createInflightCache () {
  const inflightRequests = {}

  return createAsyncMiddleware(async (req, res, next) => {
    // allow cach to be skipped if so specified
    if (req.skipCache) return next()
    // get cacheId, if cacheable
    const cacheId = cacheIdentifierForPayload(req)
    // if not cacheable, skip
    if (!cacheId) return next()
    // check for matching requests
    let activeRequestHandlers = inflightRequests[cacheId]
    // if found, wait for the active request to be handled
    if (activeRequestHandlers) {
      // setup the response listener and wait for it to be called
      // it will handle copying the result and request fields
      await createActiveRequestHandler(res, activeRequestHandlers)
      return
    }
    // setup response handler array for subsequent requests
    activeRequestHandlers = []
    inflightRequests[cacheId] = activeRequestHandlers
    // allow request to be handled normally
    await next()
    // clear inflight requests
    delete inflightRequests[cacheId]
    // schedule activeRequestHandlers to be handled
    handleActiveRequest(res, activeRequestHandlers)
    // complete
    return
  })

  function createActiveRequestHandler(res, activeRequestHandlers) {
    const { resolve, promise } = deferredPromise()
    activeRequestHandlers.push((handledRes) => {
      // append a copy of the result and error to the response
      res.result = clone(handledRes.result)
      res.error = clone(handledRes.error)
      resolve()
    })
    return promise
  }

  function handleActiveRequest(res, activeRequestHandlers) {
    // use setTimeout so we can resolve our original request first
    setTimeout(() => {
      activeRequestHandlers.forEach((handler) => {
        try {
          handler(res)
        } catch (err) {
          // catch error so all requests are handled correctly
          console.error(err)
        }
      })
    })
  }
}

function deferredPromise() {
  let resolve
  const promise = new Promise(_resolve => { resolve = _resolve })
  return { resolve, promise }
}
