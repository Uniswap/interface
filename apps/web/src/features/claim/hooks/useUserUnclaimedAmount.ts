import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { UNI } from 'uniswap/src/constants/tokens'
import { useAccount } from '~/connection/hooks/useAccount'
import { useUserClaimData } from '~/features/claim/hooks/useUserClaimData'
import { useUserHasAvailableClaim } from '~/features/claim/hooks/useUserHasAvailableClaim'

export function useUserUnclaimedAmount(account: string | null | undefined): CurrencyAmount<Token> | undefined {
  const { chainId } = useAccount()
  const userClaimData = useUserClaimData(account)
  const canClaim = useUserHasAvailableClaim(account)

  const uni = chainId ? (UNI as { [chainId: number]: Token })[chainId] : undefined
  if (!uni) {
    return undefined
  }
  if (!canClaim || !userClaimData) {
    return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(0))
  }
  return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(userClaimData.amount))
}
