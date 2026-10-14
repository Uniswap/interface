import { erc721Abi, mainnet } from '@universe/chains'
import { type Address, assume0xAddress } from '~/chains'
import type { AnvilClient } from '~/playwright/fixtures/anvil'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

/**
 * Live mainnet WETH/USDT 0.3% v3 position with liquidity and accrued fees. Collect flows read the
 * position from live mainnet, so this must be a real funded position; refresh it if ever withdrawn.
 */
export const LIVE_V3_TOKEN_ID = 1362704n

/**
 * Transfers a live mainnet position NFT to the test wallet so a position action executes on the fork.
 * Returns the live owner, which the backend still sees since it reads mainnet, not the fork.
 */
export async function transferPositionToTestWallet({
  anvil,
  positionManager,
  tokenId,
}: {
  anvil: AnvilClient
  positionManager: string
  tokenId: bigint
}): Promise<Address> {
  const realOwner = await anvil.readContract({
    address: assume0xAddress(positionManager),
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: [tokenId],
  })
  await anvil.impersonateAccount({ address: realOwner })
  await anvil.writeContract({
    address: assume0xAddress(positionManager),
    abi: erc721Abi,
    functionName: 'transferFrom',
    args: [realOwner, TEST_WALLET_ADDRESS, tokenId],
    account: realOwner,
    chain: mainnet,
  })
  // Impersonation is node config that survives evm_revert; stop it so it can't leak into later tests.
  await anvil.stopImpersonatingAccount({ address: realOwner })
  return realOwner
}
