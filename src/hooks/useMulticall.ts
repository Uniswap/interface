import { useMulticallContract } from './useContract'

interface Call {
  address: string
  calldata: string
}

type Result = string

/**
 * Low level function for doing a bunch of stateless call and returning the
 * latest results. Updates on every block.
 */
export default function useMulticall(calls: Call[]): Result {
  const contract = useMulticallContract()
}
