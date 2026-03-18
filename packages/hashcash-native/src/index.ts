import { NitroModules } from 'react-native-nitro-modules'
import type { Hashcash } from './specs/Hashcash.nitro'

/**
 * Native hashcash proof-of-work solver.
 *
 * Uses platform-native SHA256 implementation for better performance
 * than JavaScript-based hashing.
 */
export const HashcashNative = NitroModules.createHybridObject<Hashcash>('Hashcash')

export {
  benchmarkJS,
  benchmarkNative,
  runBenchmark,
  runFullBenchmark,
} from './benchmark'
export type {
  FindProofParams,
  Hashcash,
  HashcashChallenge,
  HashcashProofResult,
} from './specs/Hashcash.nitro'
