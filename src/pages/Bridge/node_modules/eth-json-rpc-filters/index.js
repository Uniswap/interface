const Mutex = require('async-mutex').Mutex
const { createAsyncMiddleware } = require('json-rpc-engine')
const createJsonRpcMiddleware = require('eth-json-rpc-middleware/scaffold')
const LogFilter = require('./log-filter.js')
const BlockFilter = require('./block-filter.js')
const TxFilter = require('./tx-filter.js')
const { intToHex, hexToInt } = require('./hexUtils')

module.exports = createEthFilterMiddleware

function createEthFilterMiddleware({ blockTracker, provider }) {

  // create filter collection
  let filterIndex = 0
  let filters = {}
  // create update mutex
  const mutex = new Mutex()
  const waitForFree = mutexMiddlewareWrapper({ mutex })

  const middleware = createJsonRpcMiddleware({
    // install filters
    eth_newFilter:                   waitForFree(toFilterCreationMiddleware(newLogFilter)),
    eth_newBlockFilter:              waitForFree(toFilterCreationMiddleware(newBlockFilter)),
    eth_newPendingTransactionFilter: waitForFree(toFilterCreationMiddleware(newPendingTransactionFilter)),
    // uninstall filters
    eth_uninstallFilter:             waitForFree(toAsyncRpcMiddleware(uninstallFilterHandler)),
    // checking filter changes
    eth_getFilterChanges:            waitForFree(toAsyncRpcMiddleware(getFilterChanges)),
    eth_getFilterLogs:               waitForFree(toAsyncRpcMiddleware(getFilterLogs)),
  })

  // setup filter updating and destroy handler
  const filterUpdater = async ({ oldBlock, newBlock }) => {
    if (filters.length === 0) return
    // lock update reads
    const releaseLock = await mutex.acquire()
    try {
      // process all filters in parallel
      await Promise.all(objValues(filters).map(async (filter) => {
        try {
         await filter.update({ oldBlock, newBlock })
        } catch (err) {
          // handle each error individually so filter update errors don't affect other filters
          console.error(err)
        }
      }))
    } catch (err) {
      // log error so we don't skip the releaseLock
      console.error(err)
    }
    // unlock update reads
    releaseLock()
  }

  // expose filter methods directly
  middleware.newLogFilter = newLogFilter
  middleware.newBlockFilter = newBlockFilter
  middleware.newPendingTransactionFilter = newPendingTransactionFilter
  middleware.uninstallFilter = uninstallFilterHandler
  middleware.getFilterChanges = getFilterChanges
  middleware.getFilterLogs = getFilterLogs

  // expose destroy method for cleanup
  middleware.destroy = () => {
    uninstallAllFilters()
  }

  return middleware

  //
  // new filters
  //

  async function newLogFilter(params) {
    const filter = new LogFilter({ provider, params })
    const filterIndex = await installFilter(filter)
    return filter
  }

  async function newBlockFilter() {
    const filter = new BlockFilter({ provider })
    const filterIndex = await installFilter(filter)
    return filter
  }

  async function newPendingTransactionFilter() {
    const filter = new TxFilter({ provider })
    const filterIndex = await installFilter(filter)
    return filter
  }

  //
  // get filter changes
  //

  async function getFilterChanges(filterIndexHex) {
    const filterIndex = hexToInt(filterIndexHex)
    const filter = filters[filterIndex]
    if (!filter) {
      throw new Error(`No filter for index "${filterIndex}"`)
    }
    const results = filter.getChangesAndClear()
    return results
  }

  async function getFilterLogs(filterIndexHex) {
    const filterIndex = hexToInt(filterIndexHex)
    const filter = filters[filterIndex]
    if (!filter) {
      throw new Error(`No filter for index "${filterIndex}"`)
    }
    // only return results for log filters
    if (filter.type === 'log') {
      results = filter.getAllResults()
    } else {
      results = []
    }
    return results
  }


  //
  // remove filters
  //


  async function uninstallFilterHandler(filterIndexHex) {
    // check filter exists
    const filterIndex = hexToInt(filterIndexHex)
    const filter = filters[filterIndex]
    const result = Boolean(filter)
    // uninstall filter
    if (result) {
      await uninstallFilter(filterIndex)
    }
    return result
  }

  //
  // utils
  //

  async function installFilter(filter) {
    const prevFilterCount = objValues(filters).length
    // install filter
    const currentBlock = await blockTracker.getLatestBlock()
    await filter.initialize({ currentBlock })
    filterIndex++
    filters[filterIndex] = filter
    filter.id = filterIndex
    filter.idHex = intToHex(filterIndex)
    // update block tracker subs
    const newFilterCount = objValues(filters).length
    updateBlockTrackerSubs({ prevFilterCount, newFilterCount })
    return filterIndex
  }

  async function uninstallFilter(filterIndex) {
    const prevFilterCount = objValues(filters).length
    delete filters[filterIndex]
    // update block tracker subs
    const newFilterCount = objValues(filters).length
    updateBlockTrackerSubs({ prevFilterCount, newFilterCount })
  }

  async function uninstallAllFilters() {
    const prevFilterCount = objValues(filters).length
    filters = {}
    // update block tracker subs
    updateBlockTrackerSubs({ prevFilterCount, newFilterCount: 0 })
  }

  function updateBlockTrackerSubs({ prevFilterCount, newFilterCount }) {
    // subscribe
    if (prevFilterCount === 0 && newFilterCount > 0) {
      blockTracker.on('sync', filterUpdater)
      return
    }
    // unsubscribe
    if (prevFilterCount > 0 && newFilterCount === 0) {
      blockTracker.removeListener('sync', filterUpdater)
      return
    }
  }

}

// helper for turning filter constructors into rpc middleware
function toFilterCreationMiddleware(createFilterFn) {
  return toAsyncRpcMiddleware(async (...args) => {
    const filter = await createFilterFn(...args)
    const result = intToHex(filter.id)
    return result
  })
}

// helper for pulling out req.params and setting res.result
function toAsyncRpcMiddleware(asyncFn) {
  return createAsyncMiddleware(async (req, res) => {
    const result = await asyncFn.apply(null, req.params)
    res.result = result
  })
}

function mutexMiddlewareWrapper({ mutex }) {
  return (middleware) => {
    return async (req, res, next, end) => {
      // wait for mutex available
      // we can release immediately because
      // we just need to make sure updates aren't active
      const releaseLock = await mutex.acquire()
      releaseLock()
      middleware(req, res, next, end)
    }
  }
}

function objValues(obj, fn){
  const values = []
  for (let key in obj) {
    values.push(obj[key])
  }
  return values
}
