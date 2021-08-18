const CONSERVATIVE_BLOCK_GAS_LIMIT = 10_000_000 // conservative, hard-coded estimate of the current block gas limit
export const DEFAULT_GAS_REQUIRED = 200_000 // the default value for calls that don't specify gasRequired

// chunks array into chunks
// evenly distributes items among the chunks
export default function chunkArray<T>(items: T[], gasLimit = CONSERVATIVE_BLOCK_GAS_LIMIT * 10): T[][] {
  const chunks: T[][] = []
  let currentChunk: T[] = []
  let currentChunkCumulativeGas = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // calculate the gas required by the current item
    const gasRequired = (item as { gasRequired?: number })?.gasRequired ?? DEFAULT_GAS_REQUIRED

    // if the current chunk is empty, or the current item wouldn't push it over the gas limit,
    // append the current item and increment the cumulative gas
    if (currentChunk.length === 0 || currentChunkCumulativeGas + gasRequired < gasLimit) {
      currentChunk.push(item)
      currentChunkCumulativeGas += gasRequired
    } else {
      // otherwise, push the current chunk and create a new chunk
      chunks.push(currentChunk)
      currentChunk = [item]
      currentChunkCumulativeGas = gasRequired
    }
  }
  if (currentChunk.length > 0) chunks.push(currentChunk)

  return chunks
}
