import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { PropsWithChildren, ReactNode } from 'react'
import { RelayEnvironmentProvider } from 'react-relay'
import {
  Environment,
  Network,
  Observable,
  RecordSource as RelayRecordSource,
  RequestParameters,
  Store,
  Variables,
} from 'relay-runtime'
import { config } from 'src/config'
import { useAsyncData } from 'src/utils/hooks'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'src/utils/time'

if (__DEV__) {
  // We need to add the plugin before creating `RelayEnvironment`. See discussion here:
  // https://github.com/th3rdwave/flipper-plugin-relay-devtools/issues/10#issuecomment-1135440690
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-flipper-relay-devtools').addPlugin()
}

const RELAY_STORE_RECORDS_KEY = 'relay-store-records'
const RELAY_STORE_DUMP_THROTTLE_MS = 30 * ONE_SECOND_MS

/**
 * Extension of relay's `RecordSource` that can restore memory cache from disk,
 * and dumps memory cache to disk after a fetch.
 */
class RecordSource extends RelayRecordSource {
  private lastDumpTimestamp: number = 0

  static async restore(): Promise<RecordSource> {
    const records = await AsyncStorage.getItem(RELAY_STORE_RECORDS_KEY)

    logger.debug('relay', 'restore', `Restoring ${records?.length ?? 0} records`)

    if (!records) {
      return new RecordSource()
    }

    return new RecordSource(JSON.parse(records))
  }

  public async dump() {
    const now = Date.now()

    if (now - this.lastDumpTimestamp < RELAY_STORE_DUMP_THROTTLE_MS) {
      return
    }

    // ignore dump requests for throttle duration, then dump
    setTimeout(() => {
      logger.debug('relay', 'dump', `Dumping ${this.size()} records`)

      this.lastDumpTimestamp = now

      return AsyncStorage.setItem(RELAY_STORE_RECORDS_KEY, JSON.stringify(this.toJSON()))
    }, RELAY_STORE_DUMP_THROTTLE_MS)
  }
}

/**
 * @returns A Relay Environment with custom `fetch`, Observables and disk persistnce.
 */
export const createRelayEnvironment = async () => {
  const recordSource = await RecordSource.restore()

  function fetchRelay(request: RequestParameters, variables: Variables) {
    /**
     * Observables allow us to fulfill many responses for the same query.
     * This is required for polling behavior.
     */
    return Observable.create((sink) => {
      fetch(config.uniswapApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.uniswapApiKey,
          // TODO: remove once API gateway supports mobile origin URL
          Origin: config.uniswapAppUrl,
        },
        body: JSON.stringify({
          query: request.text,
          variables,
        }),
      })
        .then((data) => data.json())
        .then((response) => {
          sink.next(response)
          sink.complete()

          recordSource.dump()
        })
    })
  }

  const newEnvironment = new Environment({
    network: Network.create(fetchRelay),
    store: new Store(recordSource),
  })

  return newEnvironment
}

/**
 * Persistence gate that mimics Redux's persist gate.
 * Will render `loading` until the environment has been restored.
 */
export function RelayPersistGate({ children, loading }: PropsWithChildren<{ loading: ReactNode }>) {
  const environment = useAsyncData(createRelayEnvironment).data

  if (!environment) {
    return <>{loading}</>
  }

  return <RelayEnvironmentProvider children={children} environment={environment} />
}
