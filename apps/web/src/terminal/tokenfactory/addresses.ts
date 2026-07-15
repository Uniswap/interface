/**
 * HookSwap Terminal — Token Factory (HookSwapTokenFactory) contract addresses.
 *
 * FACTS-ONLY: `HookSwapTokenFactory` is the self-service, fixed-supply ERC-20 launcher
 * (see `contracts/token-factory/src/HookSwapTokenFactory.sol`) — anyone can call
 * `createToken(name, symbol, decimals, supply)` to deploy a fresh `HookSwapERC20` whose
 * full supply is minted to the caller. The contract is built + Sepolia-tested, but its
 * Robinhood-mainnet deploy is PENDING, so every entry here is intentionally UNSET. Do NOT
 * invent an address: a chain with no entry (or `undefined`) renders an honest "Token
 * factory isn't deployed on {chain} yet" state — never fabricated data.
 *
 * When Reggie deploys HookSwapTokenFactory, fill the address below (from the deploy output /
 * `contracts/deployments/robinhood.json` `"tokenFactory"`) and the screen lights up
 * automatically — no other change needed. Mirrors `~/terminal/multisender/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `HookSwapTokenFactory` addresses. Robinhood-only launch scope;
 * structured so other HookSwap chains can be added from their deploy output.
 */
export const TOKEN_FACTORY_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0x13064247c5687a912fb362e2bb28f24e24f3bdca',
}

/**
 * Deployed `HookSwapTokenFactory` address for a chain, or `undefined` when it isn't
 * deployed there yet. Callers treat a missing address as an honest "not deployed" state.
 */
export function getTokenFactoryAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return TOKEN_FACTORY_ADDRESSES[chainId as UniverseChainId]
}
