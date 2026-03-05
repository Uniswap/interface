/**
 * Hashcash Benchmark Utility
 *
 * Compares native vs JS hashcash implementation performance.
 * Run this in your app to measure the speedup from native code.
 */
/** biome-ignore-all lint/suspicious/noConsole: dev only file */

import { HashcashNative } from './index'

interface BenchmarkResult {
  implementation: 'native' | 'js'
  difficulty: number
  counter: string | null
  attempts: number
  timeMs: number
}

interface BenchmarkSummary {
  native: BenchmarkResult
  js: BenchmarkResult
  speedup: number
}

/**
 * Run a single benchmark with the native implementation
 */
export async function benchmarkNative(difficulty: number): Promise<BenchmarkResult> {
  const challenge = {
    difficulty,
    subject: 'Benchmark',
    nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=', // "test-nonce-benchmark" in base64
    maxProofLength: 10_000_000,
  }

  const startTime = performance.now()
  const result = await HashcashNative.findProof({ challenge })
  const endTime = performance.now()

  return {
    implementation: 'native',
    difficulty,
    counter: result?.counter ?? null,
    attempts: result?.attempts ?? 0,
    timeMs: endTime - startTime,
  }
}

/**
 * Run a single benchmark with the JS implementation
 * Requires passing in the findProof function from @universe/sessions
 */
export async function benchmarkJS(
  difficulty: number,
  findProof: (params: {
    challenge: {
      difficulty: number
      subject: string
      algorithm: 'sha256'
      nonce: string
      max_proof_length: number
    }
  }) => { counter: string; attempts: number; timeMs: number } | null,
): Promise<BenchmarkResult> {
  const challenge = {
    difficulty,
    subject: 'Benchmark',
    algorithm: 'sha256' as const,
    nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=',
    max_proof_length: 10_000_000,
  }

  const result = findProof({ challenge })

  return {
    implementation: 'js',
    difficulty,
    counter: result?.counter ?? null,
    attempts: result?.attempts ?? 0,
    timeMs: result?.timeMs ?? 0,
  }
}

/**
 * Run a comparison benchmark between native and JS implementations
 */
export async function runBenchmark(
  difficulty: number,
  jsFindProof: (params: {
    challenge: {
      difficulty: number
      subject: string
      algorithm: 'sha256'
      nonce: string
      max_proof_length: number
    }
  }) => { counter: string; attempts: number; timeMs: number } | null,
): Promise<BenchmarkSummary> {
  console.log(`\n🏁 Starting hashcash benchmark (difficulty=${difficulty})...\n`)

  // Run native first
  console.log('⏱️  Running native implementation...')
  const nativeResult = await benchmarkNative(difficulty)
  console.log(`   Native: ${nativeResult.timeMs.toFixed(2)}ms (${nativeResult.attempts} attempts)`)

  // Run JS
  console.log('⏱️  Running JS implementation...')
  const jsResult = await benchmarkJS(difficulty, jsFindProof)
  console.log(`   JS: ${jsResult.timeMs.toFixed(2)}ms (${jsResult.attempts} attempts)`)

  const speedup = jsResult.timeMs / nativeResult.timeMs

  console.log(`\n📊 Results:`)
  console.log(`   Native: ${nativeResult.timeMs.toFixed(2)}ms`)
  console.log(`   JS:     ${jsResult.timeMs.toFixed(2)}ms`)
  console.log(`   Speedup: ${speedup.toFixed(2)}x faster with native\n`)

  return {
    native: nativeResult,
    js: jsResult,
    speedup,
  }
}

/**
 * Run benchmarks at multiple difficulty levels
 */
export async function runFullBenchmark(
  jsFindProof: (params: {
    challenge: {
      difficulty: number
      subject: string
      algorithm: 'sha256'
      nonce: string
      max_proof_length: number
    }
  }) => { counter: string; attempts: number; timeMs: number } | null,
): Promise<void> {
  console.log('═══════════════════════════════════════════')
  console.log('   HASHCASH NATIVE vs JS BENCHMARK')
  console.log('═══════════════════════════════════════════')

  const difficulties = [1, 2]

  for (const difficulty of difficulties) {
    await runBenchmark(difficulty, jsFindProof)
  }

  console.log('═══════════════════════════════════════════')
  console.log('   BENCHMARK COMPLETE')
  console.log('═══════════════════════════════════════════\n')
}
