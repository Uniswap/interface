// Dependency-free so a caller can pad an estimate without importing the gas-estimation stack in utils.ts.

// 20% gas buffer to avoid out-of-gas failures
const GAS_BUFFER_NUMERATOR = BigInt(12)
const GAS_BUFFER_DENOMINATOR = BigInt(10)

export function applyGasBuffer(gas: bigint): bigint {
  return (gas * GAS_BUFFER_NUMERATOR) / GAS_BUFFER_DENOMINATOR
}
