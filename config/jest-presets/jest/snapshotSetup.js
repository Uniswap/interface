// setupFilesAfterEnv-only (where `expect` exists). Reanimated 4 leaves live spring/timing
// animation descriptors in the rendered tree under the New Architecture; their
// startTimestamp/timestamp are Date.now() values. Normalize them so snapshots stay stable.
const isEpochMs = (value) => typeof value === 'number' && value > 1e12

expect.addSnapshotSerializer({
  test: (val) =>
    val != null &&
    typeof val === 'object' &&
    typeof val.onFrame === 'function' &&
    (isEpochMs(val.startTimestamp) || isEpochMs(val.timestamp)),
  serialize: (val, config, indentation, depth, refs, printer) => {
    const normalized = { ...val }
    if (isEpochMs(normalized.startTimestamp)) {
      normalized.startTimestamp = '[timestamp]'
    }
    if (isEpochMs(normalized.timestamp)) {
      normalized.timestamp = '[timestamp]'
    }
    return printer(normalized, config, indentation, depth, refs)
  },
})
