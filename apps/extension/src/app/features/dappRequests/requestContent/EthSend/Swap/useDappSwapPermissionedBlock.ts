import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'

export type DappSwapPermissionedBlock =
  | { isBlocked: false; blockedSymbol?: undefined; kycUrl?: undefined }
  | { isBlocked: true; blockedSymbol: string | undefined; kycUrl: string | undefined }

function toTokenParams(currencyInfo: Maybe<CurrencyInfo>): {
  tokenAddress: string | undefined
  chainId: number | undefined
} {
  const currency = currencyInfo?.currency
  if (!currency || currency.isNative) {
    return { tokenAddress: undefined, chainId: undefined }
  }
  return { tokenAddress: currency.address, chainId: currency.chainId }
}

// Gates dApp-requested swaps of permissioned tokens. When either leg is a permissioned
// token and the signing wallet is not allowlisted, the request popup must refuse instead
// of letting the user sign a guaranteed-revert transaction (the real Superstate token
// reverts for non-allowlisted wallets at the contract level).
//
// `walletAddress` MUST be the account the request will be signed with (the dApp-request
// queue's `currentAccount.address`), NOT the wallet's globally-active account. A dApp request
// can target a connected account that isn't the active one; keying the KYC check on the active
// account would fail open for a non-allowlisted connected account (or wrongly block the reverse).
//
// Fails open while loading and on error, matching the user-initiated swap surface; the worst
// case then equals today's behavior, an on-chain revert.
export function useDappSwapPermissionedBlock({
  inputCurrencyInfo,
  outputCurrencyInfo,
  walletAddress,
}: {
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  walletAddress: string | undefined
}): DappSwapPermissionedBlock {
  const input = toTokenParams(inputCurrencyInfo)
  const output = toTokenParams(outputCurrencyInfo)

  const inputStatus = useTokenKYCStatus({
    tokenAddress: input.tokenAddress,
    chainId: input.chainId,
    walletAddress,
  })
  const outputStatus = useTokenKYCStatus({
    tokenAddress: output.tokenAddress,
    chainId: output.chainId,
    walletAddress,
  })

  if (inputStatus.isPermissioned && !inputStatus.isAllowlisted) {
    return { isBlocked: true, blockedSymbol: inputCurrencyInfo?.currency.symbol, kycUrl: inputStatus.kycUrl }
  }
  if (outputStatus.isPermissioned && !outputStatus.isAllowlisted) {
    return { isBlocked: true, blockedSymbol: outputCurrencyInfo?.currency.symbol, kycUrl: outputStatus.kycUrl }
  }
  return { isBlocked: false }
}
