import { useMemo } from 'react'
import { ChainId, TokenAmount } from '@swapr/sdk'
import { useClaimWhitelist } from '../../state/claim/hooks'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import useHasClaimed from './useHasClaimed'
import { OLD_SWPR } from '../../constants'

export default function useUnclaimedSWPRBalance(
  account: string | null | undefined
): { loading: boolean; unclaimedBalance: TokenAmount | null } {
  const swpr = OLD_SWPR[ChainId.RINKEBY] // TODO: change to Arb1 before going live
  const whitelist = useClaimWhitelist()
  const { loading: loadingHasClaimed, claimed } = useHasClaimed(account)

  return useMemo(() => {
    if (!account || loadingHasClaimed) return { loading: true, unclaimedBalance: new TokenAmount(swpr, '0') }
    const whitelistEntry = whitelist.find(
      item => getAddress(item.account) === getAddress(account) && !BigNumber.from(item.amount).isZero()
    )
    if (!whitelistEntry) return { loading: false, unclaimedBalance: new TokenAmount(swpr, '0') }
    if (claimed) return { loading: false, unclaimedBalance: new TokenAmount(swpr, '0') }
    return {
      loading: false,
      unclaimedBalance: new TokenAmount(swpr, whitelistEntry.amount)
    }
  }, [account, claimed, loadingHasClaimed, swpr, whitelist])
}
