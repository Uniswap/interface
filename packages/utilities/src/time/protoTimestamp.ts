/** Structural `google.protobuf.Timestamp`, so callers can pass a protobuf message without this package depending on protobuf. */
interface ProtoTimestamp {
  seconds: bigint
  nanos: number
}

/** Undefined for an unset or zero timestamp, which the data-api uses for "unknown". */
export function timestampToMs(timestamp: ProtoTimestamp | undefined): number | undefined {
  if (!timestamp) {
    return undefined
  }

  // Same rounding as protobuf-es `Timestamp.toDate()`
  const ms = Number(timestamp.seconds) * 1000 + Math.ceil(timestamp.nanos / 1_000_000)
  return Number.isFinite(ms) && ms > 0 ? ms : undefined
}

export function timestampToSeconds(timestamp: ProtoTimestamp | undefined): bigint | undefined {
  if (!timestamp || timestampToMs(timestamp) === undefined) {
    return undefined
  }
  return timestamp.seconds
}
