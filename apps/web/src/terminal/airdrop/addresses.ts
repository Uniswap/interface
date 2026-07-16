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
  [UniverseChainId.Robinhood]: '0x1a1c0c6f9eadd115e6fed973b1c3cfa71dadd8d5',
  // Suite mirror deployed 2026-07-16 (see contracts/deployments/<chain>-suite.json).
  [UniverseChainId.HyperEvm]: '0x1a1c0c6f9eadd115e6fed973b1c3cfa71dadd8d5',
  [UniverseChainId.XLayer]: '0xfd0dd93a1b6157e68b0a491d94249720506dc787',
  [UniverseChainId.MegaETH]: '0x250c3448278f7b71e3e9b641f2efeb6074820e25',
  [UniverseChainId.Ink]: '0xd9d4795f2a12305a12c36455adad011f2d6143ab',
  [UniverseChainId.Tempo]: '0x144331bb4c3026d135896cafec3ae3d667f4f376',
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
