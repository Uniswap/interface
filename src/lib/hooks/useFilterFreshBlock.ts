import useBlockNumber from './useBlockNumber'

/**  Used to keep quotes up to date given a certain block age. Returns undefined if past limit. */
export default function useFilterFreshBlock<T>(
  value: T | undefined,
  getBlockNumber: (value: T) => number,
  maxBlockAge = 10
): T | undefined {
  const block = useBlockNumber()
  const valueBlock = value && getBlockNumber(value)
  if (!block || !valueBlock) return undefined
  if (block - valueBlock > maxBlockAge) return undefined
  return value
}
