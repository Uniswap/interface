/**
 * HookSwap Terminal — client-side merkle tree builder for self-service airdrops.
 *
 * THE most correctness-critical file in the airdrop suite: the leaf + node encoding here MUST
 * match `contracts/airdrop/src/MerkleDistributor.sol` + `library/MerkleProof.sol` byte-for-byte,
 * or on-chain `claim(...)` reverts with "Invalid proof." Verified against the real contract
 * source (read, not assumed):
 *
 *   • LEAF   = keccak256(abi.encodePacked(uint256 index, address account, uint256 amount))
 *            → viem `keccak256(encodePacked(['uint256','address','uint256'], [i, account, amount]))`.
 *              Cross-checked: viem's encodePacked emits exactly 32-byte index ‖ 20-byte address ‖
 *              32-byte amount (84 bytes), identical to Solidity `abi.encodePacked`.
 *   • NODE   = OZ / Uniswap sorted-pair hashing: for a pair (a, b),
 *              keccak256(abi.encodePacked(a, b)) if a <= b else keccak256(abi.encodePacked(b, a)),
 *              comparing the two bytes32 as uint256 — matches `MerkleProof.verify`'s
 *              `computedHash <= proofElement` branch. Direction-agnostic ⇒ no left/right flags.
 *
 * Tree shape mirrors Uniswap's `merkle-distributor` `MerkleTree`: the leaf set is sorted by
 * value and de-duplicated, then each layer is folded pairwise (odd tail node promoted unchanged).
 * A proof is the sibling at each layer on the path from the leaf's position up to the root.
 * Because the same in-memory tree produces both the root and every proof, they are internally
 * consistent by construction; `buildTree` additionally re-verifies EVERY proof against the root
 * with a JS re-implementation of the contract's verifier (inline asserts) before returning.
 *
 * NOTE: `encodePacked(['address', …], …)` requires a valid address; callers pass addresses
 * already normalized via `getAddress(addr.toLowerCase())` (see `useAirdrop`). Address casing is
 * irrelevant to the hash (EVM addresses are case-insensitive; encodePacked lowercases them).
 */
import { encodePacked, getAddress, keccak256, type Address, type Hex } from 'viem'

/** One recipient before tree construction: an address and a base-unit (wei) amount. */
export interface AirdropEntry {
  account: Address
  amount: bigint
}

/** Per-recipient claim payload the distributor's `claim(index, account, amount, proof)` needs. */
export interface AirdropClaim {
  index: number
  /** Base-unit (wei) amount, stringified for JSON portability. */
  amount: string
  /** Sorted-pair merkle proof (siblings, leaf → root). */
  proof: Hex[]
}

/** The full artifact: the on-chain root, the token total to fund, and every recipient's claim. */
export interface AirdropTree {
  root: Hex
  /** claims keyed by LOWERCASED recipient address. */
  claims: Record<string, AirdropClaim>
  /** Sum of all amounts — the exact amount to `token.transfer` into the distributor. */
  tokenTotal: bigint
}

/** leaf = keccak256(abi.encodePacked(uint256 index, address account, uint256 amount)). */
function leafHash(index: number, account: Address, amount: bigint): Hex {
  return keccak256(encodePacked(['uint256', 'address', 'uint256'], [BigInt(index), getAddress(account.toLowerCase()), amount]))
}

/** Compare two bytes32 as uint256 (matches the contract's `a <= b` node ordering). */
function lte(a: Hex, b: Hex): boolean {
  return BigInt(a) <= BigInt(b)
}

/** Sorted-pair parent: keccak256(min(a,b) ‖ max(a,b)). An unpaired (odd) node is promoted. */
function combinedHash(a: Hex | undefined, b: Hex | undefined): Hex {
  if (!a) {
    return b as Hex
  }
  if (!b) {
    return a
  }
  const [lo, hi] = lte(a, b) ? [a, b] : [b, a]
  return keccak256(encodePacked(['bytes32', 'bytes32'], [lo, hi]))
}

/** Build all layers bottom-up from the (already sorted+deduped) leaf layer. */
function buildLayers(leaves: Hex[]): Hex[][] {
  const layers: Hex[][] = [leaves]
  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1]
    const next: Hex[] = []
    for (let i = 0; i < current.length; i += 2) {
      next.push(combinedHash(current[i], current[i + 1]))
    }
    layers.push(next)
  }
  return layers
}

/** The proof for the leaf at `index` in the sorted leaf layer: one sibling per layer. */
function proofFor(layers: Hex[][], index: number): Hex[] {
  const proof: Hex[] = []
  let idx = index
  // The top layer is the root (single node) — it has no sibling, so iterate all but it.
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l]
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1
    if (pairIdx < layer.length) {
      proof.push(layer[pairIdx])
    }
    idx = Math.floor(idx / 2)
  }
  return proof
}

/**
 * Re-implementation of `library/MerkleProof.verify` (sorted-pair) — used ONLY to assert the tree
 * we just built produces proofs that the on-chain contract will accept.
 */
function verifyProof(proof: Hex[], root: Hex, leaf: Hex): boolean {
  let computed = leaf
  for (const p of proof) {
    computed = lte(computed, p) ? keccak256(encodePacked(['bytes32', 'bytes32'], [computed, p])) : keccak256(encodePacked(['bytes32', 'bytes32'], [p, computed]))
  }
  return computed === root
}

/**
 * Build the merkle tree from a recipient list.
 *
 * Ordering is deterministic: entries are sorted by address ascending and the `index` committed to
 * each leaf is that sorted position (so the same CSV always yields the same root + indices). The
 * leaf SET is then value-sorted for the tree layout (Uniswap `MerkleTree` shape) — this does not
 * change the claim indices, only which siblings pair up.
 *
 * @throws if two entries share an address (duplicate ⇒ ambiguous claim) or the list is empty.
 */
export function buildTree(entries: AirdropEntry[]): AirdropTree {
  if (entries.length === 0) {
    throw new Error('Airdrop is empty — add at least one recipient.')
  }

  // Deterministic order: sort by address, assign the committed index in that order.
  const sorted = [...entries].sort((a, b) => (BigInt(a.account) < BigInt(b.account) ? -1 : BigInt(a.account) > BigInt(b.account) ? 1 : 0))

  const claims: Record<string, AirdropClaim> = {}
  const nodes: { key: string; leaf: Hex }[] = []
  let tokenTotal = 0n

  sorted.forEach((entry, index) => {
    const key = entry.account.toLowerCase()
    if (claims[key]) {
      throw new Error(`Duplicate address in airdrop: ${entry.account}`)
    }
    const leaf = leafHash(index, entry.account, entry.amount)
    claims[key] = { index, amount: entry.amount.toString(), proof: [] }
    nodes.push({ key, leaf })
    tokenTotal += entry.amount
  })

  // Uniswap MerkleTree shape: value-sort the leaves for the layout, then fold pairwise.
  const leaves = nodes.map((n) => n.leaf).sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0))
  const layers = buildLayers(leaves)
  const root = layers[layers.length - 1][0]

  // Attach each claim's proof (found by the leaf's position in the value-sorted leaf layer).
  for (const node of nodes) {
    const position = leaves.indexOf(node.leaf)
    claims[node.key].proof = proofFor(layers, position)
  }

  // --- inline sanity asserts: the built tree MUST verify like the on-chain contract will ---
  for (const node of nodes) {
    const claim = claims[node.key]
    const leaf = leafHash(claim.index, getAddress(node.key), BigInt(claim.amount))
    if (leaf !== node.leaf) {
      throw new Error('merkle: leaf recomputation mismatch (encoding bug)')
    }
    if (!verifyProof(claim.proof, root, leaf)) {
      throw new Error(`merkle: proof failed to verify for ${node.key} (would revert on-chain)`)
    }
  }
  // Single-recipient trees have an empty proof and root == the sole leaf.
  if (leaves.length === 1 && root !== leaves[0]) {
    throw new Error('merkle: single-leaf root mismatch')
  }

  return { root, claims, tokenTotal }
}
