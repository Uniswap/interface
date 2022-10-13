'use strict'

module.exports = function asMiddleware (engine) {
  return function engineAsMiddleware (req, res, next, end) {
    engine._runAllMiddleware(req, res)
      .then(async ({ isComplete, returnHandlers }) => {

        if (isComplete) {
          await engine._runReturnHandlers(returnHandlers)
          return end()
        }

        return next(async (handlerCallback) => {
          try {
            await engine._runReturnHandlers(returnHandlers)
          } catch (err) {
            return handlerCallback(err)
          }
          return handlerCallback()
        })
      })
      .catch((error) => {
        end(error)
      })
  }
}
