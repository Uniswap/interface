import { MMKV } from 'react-native-mmkv'
import { RecordSource as RelayRecordSource } from 'relay-runtime'
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes'
import { logger } from 'src/utils/logger'
import { ONE_MINUTE_MS } from 'src/utils/time'

const RELAY_STORE_RECORDS_KEY = 'relay-store-records'
const RELAY_STORE_DUMP_THROTTLE_MS = ONE_MINUTE_MS

/**
 * Extension of relay's `RecordSource` that can restore memory cache from disk,
 * and dumps memory cache to disk after a fetch.
 */
export class RecordSource extends RelayRecordSource {
  private isThrottlingDump = false

  constructor(private storage: MMKV, private key: string, records?: RecordMap) {
    super(records)
  }

  static restore(storage: MMKV, key: string = RELAY_STORE_RECORDS_KEY): RecordSource {
    const records = storage.getString(key)

    logger.debug('relay', 'restore', `Restoring ${records?.length ?? 0} records`)

    if (!records) {
      return new RecordSource(storage, key)
    }

    return new RecordSource(storage, key, JSON.parse(records))
  }

  dump() {
    if (this.isThrottlingDump) {
      return
    }

    this.isThrottlingDump = true
    const records = this.toJSON()

    logger.debug('relay', 'restore', `Dumping ${Object.keys(records).length} records`)

    this.storage.set(this.key, JSON.stringify(records))

    setTimeout(() => {
      this.isThrottlingDump = false
    }, RELAY_STORE_DUMP_THROTTLE_MS)
  }
}
