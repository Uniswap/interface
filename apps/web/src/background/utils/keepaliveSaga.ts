import { REHYDRATE } from 'redux-persist'
import { WebState } from 'src/background/store'
import { openTab } from 'src/background/utils/navigationSaga'
import { call, delay, put, select, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { lockWallet, unlockWallet } from 'wallet/src/features/wallet/slice'

// The service worker will be shut down if there is no activity for 30 seconds.
// https://developer.chrome.com/docs/extensions/mv3/service_workers/service-worker-lifecycle/#idle-shutdown
const KEEP_ALIVE_INTERVAL_MS = 1000 * 15 // 15 seconds
const KEEP_ALIVE_PING = { content: 'keep_alive_ping' }
const KEEP_ALIVE_PORT_NAME = 'keep_alive'
const KEEP_ALIVE_START_DELAY_MS = 1000 * 4 // 4 seconds

let alivePort: Nullable<chrome.runtime.Port> = null
let lastCall = Date.now()

/**
 * Keeps service worker process alive without external intervention while the wallet is unlocked
 * or extension pages are open.
 *
 * @ref see `doWork()` for implementation details.
 */
export function* keepAliveSaga() {
  // When browser is restarted, previous state may still be unlocked although password does not exist in memory.
  // Wait for rehydration so we can override previous auth state, and ensure wallet is locked on startup.
  yield* take(REHYDRATE)
  yield* put(lockWallet())

  // Delay work until app is likely done rendering new auth state.
  yield* delay(KEEP_ALIVE_START_DELAY_MS)

  // Whenever one of these actions is dispatched, we'll resume the keepalive work.
  // We'll watch for the wallet to be unlocked or extension pages to be opened.
  const wakeUpActions: string[] = [unlockWallet.type, openTab.type]

  let shouldKeepAlive = yield* call(checkShouldKeepAlive)

  while (
    shouldKeepAlive ||
    // Wait for one of the `wakeUpActions` to be dispatched.
    (yield* take((action: { type: string }) => wakeUpActions.includes(action.type)))
  ) {
    yield* call(logTime)
    yield* call(doWork)
    yield* delay(KEEP_ALIVE_INTERVAL_MS)

    shouldKeepAlive = yield* call(checkShouldKeepAlive)

    if (!shouldKeepAlive) {
      logger.debug('keepAlive', 'stop', 'stopping keep alive')
    }
  }
}

function* checkShouldKeepAlive() {
  const isUnlocked = yield* select((state: WebState) => state.wallet.isUnlocked)
  if (isUnlocked) {
    return true
  }
  const areExtensionPagesOpen = yield* call(checkIfExtensionPagesAreOpen)
  return areExtensionPagesOpen
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
          tags: { file: 'keepaliveSaga', function: 'doWork' },
        })
      }

      alivePort = null
    })
  }

  if (alivePort) {
    // 2. post message to nonexistent listener
    alivePort.postMessage(KEEP_ALIVE_PING)

    if (chrome.runtime.lastError) {
      logger.error(chrome.runtime.lastError, {
        tags: { file: 'keepaliveSaga', function: 'doWork' },
      })
    } else {
      // no-op.
      logger.debug('background', 'doWork:postmessage', `ping sent through ${alivePort.name}`)
    }
  }
}

function logTime(): void {
  const now = Date.now()
  logger.debug('keepAlive', 'continue', 'time elapsed: ', now - lastCall)
  lastCall = Date.now()
}

async function checkIfExtensionPagesAreOpen(): Promise<boolean> {
  const extension = await chrome.management.getSelf()
  const tabs = await chrome.tabs.query({ url: `chrome-extension://${extension.id}/*` })
  return tabs.length > 0
}
