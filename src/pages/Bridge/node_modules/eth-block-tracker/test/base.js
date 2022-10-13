const test = require('tape')
const noop = () => {}
const timeout = (duration) => new Promise(resolve => setTimeout(resolve, duration))

module.exports = (test, testLabel, BaseBlockTracker) => {

  test(`${testLabel} - autostart`, (t) => {
    const blockTracker = new BaseBlockTracker()
    t.equal(blockTracker.isRunning(), false, 'block tracker is stopped after creation')

    // check non-starts
    blockTracker.once('hello', () => t.fail('should never be called'))
    t.equal(blockTracker.isRunning(), false, 'block tracker is not started by unrelated event')

    blockTracker.once('block', () => t.fail('should never be called'))
    t.equal(blockTracker.isRunning(), false, 'block tracker is not started by removed "block" event')

    // check start
    blockTracker.once('latest', noop)
    t.equal(blockTracker.isRunning(), true, 'block tracker is started by "latest" event')

    // check stop
    blockTracker.removeListener('latest', noop)
    t.equal(blockTracker.isRunning(), false, 'block tracker stops after all handlers are removed')

    // cleanup
    blockTracker.removeAllListeners()
    t.end()
  })

  test(`${testLabel} - "_start" and "_stop" methods`, (t) => {
    let start = 0
    let end = 0

    // custom subclass to track calls to _start/_end
    class TestBlockTracker extends BaseBlockTracker {
      _start() {
        start++
      }
      _end() {
        end++
      }
    }

    const blockTracker = new TestBlockTracker()

    // basic start stop check
    t.equal(start, 0, 'start is not called during instantiation')
    t.equal(end, 0, 'end is not called during instantiation')
    blockTracker.on('latest', noop)
    t.equal(start, 1, 'start is called once with new handler')
    t.equal(end, 0, 'end is not called on new handler')
    blockTracker.on('latest', noop)
    t.equal(start, 1, 'start is not called again with 2nd handler')
    t.equal(end, 0, 'end is not called on 2nd handler')
    blockTracker.on('sync', noop)
    t.equal(start, 1, 'start is not called again with 3rd different handler')
    t.equal(end, 0, 'end is not called on 3rd different handler')
    blockTracker.removeAllListeners()
    t.equal(start, 1, 'start is not called again after removing handler')
    t.equal(end, 1, 'end is called after all handlers removed')

    // multiple separate removes calls end only once
    blockTracker.once('latest', noop)
    t.equal(start, 2, 'start is called again on new handler')
    t.equal(end, 1, 'end is not called again')
    blockTracker.once('latest', noop)
    blockTracker.once('latest', noop)
    blockTracker.emit('latest')
    t.equal(start, 2, 'start is called again after triggering "once" handlers')
    t.equal(end, 2, 'end is called only once after clearing "once" hanlders')

    // cleanup
    blockTracker.removeAllListeners()
    t.end()
  })

  test(`${testLabel} - block staleness`, async (t) => {
    let blockFetchs = 0

    // custom subclass to track calls to _start/_end
    class TestBlockTracker extends BaseBlockTracker {
      async _fetchLatestBlock() {
        blockFetchs++
        // dummy block with unique hash
        return { hash: blockFetchs }
      }
      async _start () {
        const latestBlock = await this._fetchLatestBlock()
        this._newPotentialLatest(latestBlock)
      }
    }

    const blockResetDuration = 100
    const blockTracker = new TestBlockTracker({
      blockResetDuration,
    })

    try {
      t.equal(blockTracker.isRunning(), false, 'block tracker is stopped after creation')
      t.notOk(blockTracker.getCurrentBlock(), 'block tracker has no current block')
      t.equal(blockFetchs, 0, 'block-tracker has not fetched any blocks')

      const firstBlock = await blockTracker.getLatestBlock()
      t.ok(firstBlock, 'blockTracker.getLatestBlock returned a block')
      t.equal(blockFetchs, 1, 'block-tracker has fetched one block')
      t.equal(blockTracker.isRunning(), false, 'block tracker is still stopped')
      t.ok(blockTracker.getCurrentBlock(), 'block tracker has a current block')

      await timeout(blockResetDuration)
      t.equal(blockFetchs, 1, 'block-tracker still has fetched only one block')
      t.equal(blockTracker.isRunning(), false, 'block tracker is still stopped')
      t.notOk(blockTracker.getCurrentBlock(), 'block tracker has no current block')

      const secondBlock = await blockTracker.getLatestBlock()
      t.ok(secondBlock, 'blockTracker.getLatestBlock returned a block')
      t.equal(blockFetchs, 2, 'block-tracker has fetched a 2nd block')
      t.equal(blockTracker.isRunning(), false, 'block tracker is still stopped')
      t.ok(blockTracker.getCurrentBlock(), 'block tracker has a current block')
    } catch (err) {
      console.error(err)
      t.ifError(err)
    }

    // cleanup
    blockTracker.removeAllListeners()
    t.end()
  })

  test(`${testLabel} - multiple getLatestBlock when off`, async (t) => {
    let blockFetchs = 0

    // custom subclass to track calls to _start/_end
    class TestBlockTracker extends BaseBlockTracker {
      async _fetchLatestBlock() {
        blockFetchs++
        // dummy block with unique hash
        return { hash: blockFetchs }
      }
      async _start () {
        const latestBlock = await this._fetchLatestBlock()
        this._newPotentialLatest(latestBlock)
      }
    }

    const blockResetDuration = 100
    const blockTracker = new TestBlockTracker({
      blockResetDuration,
    })
    t.equal(blockTracker.isRunning(), false, 'block tracker is stopped after creation')
    t.notOk(blockTracker.getCurrentBlock(), 'block tracker has no current block')
    t.equal(blockFetchs, 0, 'block-tracker has not fetched any blocks')

    let block1, block2
    await Promise.all([
      (async () => { block1 = await blockTracker.getLatestBlock() })(),
      (async () => { block2 = await blockTracker.getLatestBlock() })(),
    ])
    t.ok(block1, 'blockTracker.getLatestBlock returned a block')
    t.ok(block2, 'blockTracker.getLatestBlock returned a block')
    t.equal(block1, block2, 'blocks are the same obj')
    t.equal(blockFetchs, 1, 'block-tracker has fetched only one block')
    t.equal(blockTracker.isRunning(), false, 'block tracker is still stopped')

    // cleanup
    blockTracker.removeAllListeners()
    t.end()
  })

}
