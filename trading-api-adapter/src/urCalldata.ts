/**
 * Universal Router calldata compatibility shim for HookSwap's deployed UR fork.
 *
 * WHY: The Universal Router deployed on Robinhood (0x3D30133F4d4A80684F02d8310faF572E3dc193b3)
 * is a NON-canonical "min-hop-price" fork. Its swap-command inputs decode SIX fields — the
 * canonical five plus a trailing `uint256[] minHopPriceX36` (per-hop min price, empty = disabled).
 * See forks/universal-router/contracts/base/Dispatcher.sol (V2/V3 SWAP_EXACT_IN/OUT) +
 * V2SwapRouter.sol:27,76 ("empty to disable").
 *
 * The SOR / @uniswap/universal-router-sdk that builds our calldata emits the canonical FIVE-field
 * layout. Feeding that to the deployed fork reverts with `SliceOutOfBounds()` at input decode
 * (word 5 — the path length — is read as a bogus array offset), BEFORE any token movement.
 * Verified on-chain: 5-field -> SliceOutOfBounds; 6-field (empty minHopPriceX36[]) -> decode passes.
 *
 * FIX: re-encode every affected command input, appending an empty `uint256[]` so the calldata
 * matches the deployed ABI while disabling the (unused) min-hop-price feature. Applied at the single
 * point calldata leaves the embed router; idempotently no-ops on anything that isn't the canonical
 * 5-field swap layout, so it's safe if the upstream SDK is ever swapped for a matching fork.
 */
import { ethers } from 'ethers'

// Universal Router entrypoints. Our deployed fork uses the deadline variant (selector 0x3593564c);
// the no-deadline variant is handled too for robustness.
const EXECUTE_WITH_DEADLINE = '0x3593564c' // execute(bytes,bytes[],uint256)
const EXECUTE_NO_DEADLINE = '0x24856bc3' //   execute(bytes,bytes[])

// Low 6 bits of a command byte select the command; the top bit is FLAG_ALLOW_REVERT.
const COMMAND_TYPE_MASK = 0x3f

// Only these swap commands carry the trailing `minHopPriceX36` in the deployed fork.
const V3_SWAP_EXACT_IN = 0x00
const V3_SWAP_EXACT_OUT = 0x01
const V2_SWAP_EXACT_IN = 0x08
const V2_SWAP_EXACT_OUT = 0x09

// Canonical (5-field) input tuples, WITHOUT the trailing minHopPriceX36.
const V2_BASE_TYPES = ['address', 'uint256', 'uint256', 'address[]', 'bool']
const V3_BASE_TYPES = ['address', 'uint256', 'uint256', 'bytes', 'bool']

function baseTypesForCommand(command: number): string[] | undefined {
  switch (command) {
    case V2_SWAP_EXACT_IN:
    case V2_SWAP_EXACT_OUT:
      return V2_BASE_TYPES
    case V3_SWAP_EXACT_IN:
    case V3_SWAP_EXACT_OUT:
      return V3_BASE_TYPES
    default:
      return undefined
  }
}

const coder = ethers.utils.defaultAbiCoder

/**
 * Rewrite a Universal Router `execute(...)` calldata so its V2/V3 swap-command inputs carry the
 * extra empty `uint256[] minHopPriceX36` the deployed fork expects. Returns the input unchanged if
 * it isn't a recognized `execute` call or contains no canonical 5-field swap commands.
 */
export function patchMinHopPriceCalldata(calldata: string): string {
  if (typeof calldata !== 'string' || calldata.length < 10) {
    return calldata
  }
  const selector = calldata.slice(0, 10).toLowerCase()
  const hasDeadline = selector === EXECUTE_WITH_DEADLINE
  if (!hasDeadline && selector !== EXECUTE_NO_DEADLINE) {
    return calldata
  }

  const execTypes = hasDeadline ? ['bytes', 'bytes[]', 'uint256'] : ['bytes', 'bytes[]']
  let decoded: ethers.utils.Result
  try {
    decoded = coder.decode(execTypes, '0x' + calldata.slice(10))
  } catch {
    return calldata
  }

  const commands: string = decoded[0]
  const inputs: string[] = decoded[1]
  const commandBytes = ethers.utils.arrayify(commands)

  let changed = false
  const patchedInputs = inputs.map((input, i) => {
    const command = commandBytes[i] & COMMAND_TYPE_MASK
    const baseTypes = baseTypesForCommand(command)
    if (!baseTypes) {
      return input
    }
    let values: ethers.utils.Result
    try {
      values = coder.decode(baseTypes, input)
    } catch {
      // Not the canonical 5-field layout (already patched, or an unexpected shape) — leave as-is.
      return input
    }
    changed = true
    // Append an empty minHopPriceX36[] (disables the per-hop min-price feature).
    return coder.encode([...baseTypes, 'uint256[]'], [...Array.from(values), []])
  })

  if (!changed) {
    return calldata
  }

  const reEncoded = hasDeadline
    ? coder.encode(['bytes', 'bytes[]', 'uint256'], [commands, patchedInputs, decoded[2]])
    : coder.encode(['bytes', 'bytes[]'], [commands, patchedInputs])
  return calldata.slice(0, 10) + reEncoded.slice(2)
}
