/**
 * HookSwap Terminal — Airdrop (MerkleDistributorFactory) contract addresses.
 *
 * FACTS-ONLY: `MerkleDistributorFactory` is the self-service merkle-airdrop deployer
 * (see `contracts/airdrop/src/MerkleDistributorFactory.sol`) — anyone can call
 * `createDistributor(token, merkleRoot)` to deploy a fresh `MerkleDistributor` (one token,
 * one immutable root), then fund it with a plain `token.transfer(distributor, total)` and let
 * recipients claim with a merkle proof. The contract is built + audited (L-1 fixed) +
 * Sepolia-tested, but its Robinhood-mainnet deploy is PENDING, so every entry here is
 * intentionally UNSET. Do NOT invent an address: a chain with no entry (or `undefined`) renders
 * an honest "Airdrops aren't deployed on {chain} yet" state — never fabricated data.
 *
 * When Reggie deploys MerkleDistributorFactory, fill the address below (from the deploy output /
 * `contracts/deployments/robinhood-airdrop.json` `"merkleDistributorFactory"`) and the screen
 * lights up automatically — no other change needed. Mirrors `~/terminal/farms/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `MerkleDistributorFactory` addresses. Robinhood-only launch scope;
 * structured so other HookSwap chains can be added from their deploy output.
 */
export const AIRDROP_FACTORY_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  // Robinhood (4663) — fill after Reggie deploys MerkleDistributorFactory (contracts/airdrop).
  // [UniverseChainId.Robinhood]: '0x…',
}

/**
 * Deployed `MerkleDistributorFactory` address for a chain, or `undefined` when it isn't deployed
 * there yet. Callers treat a missing address as an honest "not deployed" state.
 */
export function getAirdropFactory(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return AIRDROP_FACTORY_ADDRESSES[chainId as UniverseChainId]
}
