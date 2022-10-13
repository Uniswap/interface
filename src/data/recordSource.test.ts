import { MMKV } from 'react-native-mmkv'
import { RecordSource } from 'src/data/recordSource'

const STORE_KEY = 'my-test-key'

const RECORDS = { id1: { key1: 'value1' } }

describe(RecordSource, () => {
  let storage: MMKV

  beforeAll(() => {
    // reset storage
    storage = new MMKV()
  })

  it('restores from disk', () => {
    storage.set(STORE_KEY, JSON.stringify(RECORDS))

    const recordSource = RecordSource.restore(storage, STORE_KEY)

    expect(recordSource.toJSON()).toEqual(RECORDS)
  })

  it('dumps to disk', async () => {
    const recordSource = new RecordSource(storage, STORE_KEY)
    recordSource.dump()

    expect(JSON.parse(storage.getString(STORE_KEY) || '')).toEqual(RECORDS)
  })
})
