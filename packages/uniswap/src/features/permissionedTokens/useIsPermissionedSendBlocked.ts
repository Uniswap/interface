import type { Currency } from '@uniswap/sdk-core'
import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'

// Which party's allowlist status blocks the send. The Superstate AllowList enforces on BOTH
// endpoints, so a permissioned transfer reverts if either the sender or the recipient is not
// allowlisted. 'sender' takes precedence: a non-allowlisted sender can't send to anyone.
export type PermissionedSendBlockReason = 'sender' | 'recipient'

// Gate permissioned-token sends on BOTH the sender's and the recipient's allowlist status.
// A holder is normally allowlisted (you must be allowlisted to receive the token in the first
// place), but the two can decouple if the holder is later removed from the allowlist (e.g. a
// compliance offboarding) while still holding a balance. In that state every transfer reverts on
// the sender check, so we surface a sender-specific block. Otherwise we block when the resolved
// recipient isn't allowlisted.
export function useIsPermissionedSendBlocked({
  sendCurrency,
  senderAddress,
  recipientAddress,
}: {
  sendCurrency: Currency | undefined
  senderAddress: string | undefined
  recipientAddress: string | undefined
}): {
  isPermissionedSendBlocked: boolean
  isPermissionedSendBlockedLoading: boolean
  permissionedSendBlockReason?: PermissionedSendBlockReason
} {
  const tokenAddress = sendCurrency && !sendCurrency.isNative ? sendCurrency.address : undefined
  const chainId = sendCurrency?.chainId

  // Sender's permissioned + allowlist status. Keyed on the holder, so this one call tells us both
  // whether the token is permissioned AND whether the sender is still allowlisted. Fails open
  // (isAllowlisted: true) while loading, pre-wallet, on error, and for non-permissioned tokens.
  const {
    isPermissioned,
    isAllowlisted: senderAllowlisted,
    isLoading: tokenLoading,
  } = useTokenKYCStatus({
    tokenAddress,
    chainId,
    walletAddress: chainId ? senderAddress : undefined,
  })

  // A non-allowlisted sender can't transfer the token to anyone (the sender side of the AllowList
  // check reverts), so this blocks regardless of recipient or self-send and takes precedence.
  const senderBlocked = isPermissioned && !!senderAddress && !tokenLoading && !senderAllowlisted

  // Self-sends can't be blocked on the recipient: the sender is the recipient and already holds the token.
  const isSelfSend = areEvmAddressesEqual(senderAddress, recipientAddress)

  // Only run the recipient allowlist check once the sender is cleared and we have a real, non-self
  // recipient for a permissioned token. `useTokenKYCStatus` fails open (isAllowlisted: true) with no
  // wallet and while loading, so an unresolved recipient never produces a false block.
  const shouldCheckRecipient = isPermissioned && !senderBlocked && !!recipientAddress && !isSelfSend
  const { isAllowlisted: recipientAllowlisted, isLoading: recipientLoading } = useTokenKYCStatus({
    tokenAddress: shouldCheckRecipient ? tokenAddress : undefined,
    chainId: shouldCheckRecipient ? chainId : undefined,
    walletAddress: shouldCheckRecipient ? recipientAddress : undefined,
  })

  const recipientBlocked = shouldCheckRecipient && !recipientLoading && !recipientAllowlisted

  return {
    isPermissionedSendBlocked: senderBlocked || recipientBlocked,
    isPermissionedSendBlockedLoading: tokenLoading || (shouldCheckRecipient && recipientLoading),
    permissionedSendBlockReason: senderBlocked ? 'sender' : recipientBlocked ? 'recipient' : undefined,
  }
}
