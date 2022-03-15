import { BytesLike } from 'ethers'
import { Multicall } from 'generated'

const BUCKET_SIZE = 500

export const multicallBatch = async (
  multicall: Multicall,
  calls: { target: string; callData: BytesLike }[],
  bucketSize = BUCKET_SIZE
): Promise<string[]> => {
  const results = []
  let i = 0
  while (i < calls.length) {
    results.push(...(await multicall.callStatic.aggregate(calls.slice(i, i + bucketSize)).then((r) => r.returnData)))
    i += bucketSize
  }
  return results
}
