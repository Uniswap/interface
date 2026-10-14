import { Timestamp, type PlainMessage } from '@bufbuild/protobuf'

/** Undefined for an unset or zero timestamp, which the data-api uses for "unknown". */
export function timestampToMs(timestamp: PlainMessage<Timestamp> | undefined): number | undefined {
  if (!timestamp) {
    return undefined
  }

  const ms = new Timestamp(timestamp).toDate().getTime()
  return Number.isFinite(ms) && ms > 0 ? ms : undefined
}
