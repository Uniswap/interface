import { REHYDRATE } from 'redux-persist'
import { call, cancel, cancelled, delay, fork, put, take } from 'typed-redux-saga'
import { authActions } from 'wallet/src/features/auth/saga'
import { logger } from 'wallet/src/features/logger/logger'
import { lockWallet } from 'wallet/src/features/wallet/slice'
import { SagaStatus } from 'wallet/src/utils/saga'
import serializeError from 'wallet/src/utils/serializeError'

const KEEP_ALIVE_INTERVAL_MS = 5000 // * 60 * 1000 // 5 minutes
const KEEP_ALIVE_PING = { content: 'keep_alive_ping' }
const KEEP_ALIVE_PORT_NAME = 'keep_alive'
const KEEP_ALIVE_START_DELAY_MS = 4 * 1000 // 4 seconds

let alivePort: Nullable<chrome.runtime.Port> = null
let lastCall = Date.now()

/**
 * Keeps service worker proess alive without external intervention (i.e. does not need
 * external pages/popup/options.etc. opened).
 *
 * @ref see ``doWork()` for implementation details.
 */
export function* keepAliveSaga() {
  // When browser is restarted, previous state may still be unlocked although password does not exist in memory.
  // Wait for rehydration so we can override previous auth state, and ensure wallet is locked on startup.
  yield* take(REHYDRATE)
  yield* put(lockWallet())
  while (
    // waits for success auth action to be dispatched

    yield* take(
      // could be any action type dispatched by store
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (action: any) =>
        action.type === authActions.progress.type && action.payload === SagaStatus.Success
    )
  ) {
    // start keep alive task in the background
    const keepAliveTask = yield* fork(keepAliveLoop)

    // wait for auth reset action to be dispatched
    yield* take(authActions.reset.type)

    // after wallet is locked, cancel background keep alive task
    // (will cause forked keepAliveLoop task to jump to finally block)
    yield* cancel(keepAliveTask)
  }
}

/**
 * Worker function
 * Performs "work" in the background to keep service worker alive.
 * Canceling task will trigger finally block with cleanup operations.
 */
function* keepAliveLoop() {
  logger.debug('keepalive', 'keepAliveLoop', 'started')

  // delay work until app is liekly done rendering new auth state
  yield* delay(KEEP_ALIVE_START_DELAY_MS)

  while (true) {
    try {
      yield* call(doWork)
      yield* delay(KEEP_ALIVE_INTERVAL_MS)
      yield* call(logTime)
    } finally {
      if (yield* cancelled()) {
        yield* call(stopKeepAliveLoop)
      }
    }
  }
}

function stopKeepAliveLoop(): void {
  logger.debug('keepalive', 'stop', 'stopping keep alive')
  // no-op
}

/**
 * Keeps service worker in `RUNNING` state without external intervention by doing "work".
 *
 * On start, loop:
 *   1. Connect to named port
 *   2. Send a message to a nonexistent listener (that will generate an error)
 *   3. Catches and logs error (in `onDisconnect`)
 *
 * While looping, service worker is active, and Chrome will not shut it down.
 *
 * @ref https://www.youtube.com/watch?v=Vmb1tqYqyII&t=68s
 * @ref https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
 * @ref https://bugs.chromium.org/p/chromium/issues/detail?id=1406613
 *
 * NOTE: remember to debug with `chrome://serviceworker-internals`
 */
function doWork(): void {
  if (alivePort === null) {
    // 1. attempt to connect to named port (expected to fail)
    alivePort = chrome.runtime.connect({ name: KEEP_ALIVE_PORT_NAME })

    alivePort.onDisconnect.addListener(() => {
      // 3. catch (expected) connection error
      if (chrome.runtime.lastError) {
        // no-op: expected.
        logger.debug(
          'background',
          'doWork:onDisconnect',
          'expected disconnect -- server worker should still be running'
        )
      } else {
        logger.error('Port disconnected unexpectedly', {
          tags: {
            file: 'keepaliveSaga',
            function: 'doWork',
          },
        })
      }

      alivePort = null
    })
  }

  if (alivePort) {
    // 2. post message to nonexistent listener
    alivePort.postMessage(KEEP_ALIVE_PING)

    if (chrome.runtime.lastError) {
      logger.error('Port message error', {
        tags: {
          file: 'keepaliveSaga',
          function: 'doWork',
          error: serializeError(chrome.runtime.lastError),
        },
      })
    } else {
      // no-op.
      logger.debug('background', 'doWork:postmessage', `ping sent through ${alivePort.name}`)
    }
  }
}

function logTime(): void {
  const now = Date.now()
  logger.debug('keepalive', 'startKeepAlive', 'time elapsed: ', now - lastCall)
  lastCall = Date.now()
}
