# json-rpc-engine

A tool for processing JSON-RPC requests and responses.

## Usage

```js
const RpcEngine = require('json-rpc-engine')

let engine = new RpcEngine()
```

Build a stack of JSON-RPC processors by pushing middleware to the engine.

```js
engine.push(function(req, res, next, end){
  res.result = 42
  end()
})
```

Requests are handled asynchronously, stepping down the stack until complete.

```js
let request = { id: 1, jsonrpc: '2.0', method: 'hello' }

engine.handle(request, function(err, response){
  // do something with response.result
})

// there is also a Promise signature
const response = await engine.handle(request)
```

Middleware have direct access to the request and response objects.
They can let processing continue down the stack with `next()`, or complete the request with `end()`.

```js
engine.push(function(req, res, next, end){
  if (req.skipCache) return next()
  res.result = getResultFromCache(req)
  end()
})
```

By passing a _return handler_ to the `next` function, you can get a peek at the result before it returns.

```js
engine.push(function(req, res, next, end){
  next(function(cb){
    insertIntoCache(res, cb)
  })
})
```

RpcEngines can be nested by converting them to middleware using `asMiddleware(engine)`:

```js
const asMiddleware = require('json-rpc-engine/src/asMiddleware')

let engine = new RpcEngine()
let subengine = new RpcEngine()
engine.push(asMiddleware(subengine))
```

### `async` Middleware

If you require your middleware function to be `async`, use `createAsyncMiddleware`:

```js
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

let engine = new RpcEngine()
engine.push(createAsyncMiddleware(async (req, res, next) => {
  res.result = 42
  next()
}))
```

`async` middleware do not take an `end` callback.
Instead, the request ends if the middleware returns without calling `next()`:

```js
engine.push(createAsyncMiddleware(async (req, res, next) => {
  res.result = 42
  /* The request will end when this returns */
}))
```

The `next` callback of `async` middleware also don't take return handlers.
Instead, you can `await next()`.
When the execution of the middleware resumes, you can work with the response again.

```js
engine.push(createAsyncMiddleware(async (req, res, next) => {
  res.result = 42
  await next()
  /* Your return handler logic goes here */
  addToMetrics(res)
}))
```

You can freely mix callback-based and `async` middleware:

```js
engine.push(function(req, res, next, end){
  if (!isCached(req)) {
    return next((cb) => {
      insertIntoCache(res, cb)
    })
  }
  res.result = getResultFromCache(req)
  end()
})

engine.push(createAsyncMiddleware(async (req, res, next) => {
  res.result = 42
  await next()
  addToMetrics(res)
}))
```

### Gotchas

Handle errors via `end(err)`, *NOT* `next(err)`.

```js
/* INCORRECT */
engine.push(function(req, res, next, end){
  next(new Error())
})

/* CORRECT */
engine.push(function(req, res, next, end){
  end(new Error())
})
```

However, `next()` will detect errors on the response object, and cause
`end(res.error)` to be called.

```js
engine.push(function(req, res, next, end){
  res.error = new Error()
  next() /* This will cause end(res.error) to be called. */
})
```
