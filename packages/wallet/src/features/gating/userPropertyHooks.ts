import { useEffect } from 'react'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function useGatingUserPropertyUsernames(): void {
  const activeAccount = useActiveAccount()
  const validatedAddress = getValidAddress(activeAccount?.address)
  const { data: ens } = useENSName(validatedAddress ?? undefined)
  const { unitag } = useUnitagByAddress(validatedAddress ?? undefined)

  useEffect(() => {
    const statsigClient = getStatsigClient()
    const { user } = statsigClient.getContext()
    const newEns = ens?.split('.')[0]
    if (activeAccount?.type === AccountType.SignerMnemonic) {
      statsigClient
        .updateUserAsync({
          ...user,
          privateAttributes: {
            ...user?.privateAttributes,
            unitag: unitag?.username,
            ens: newEns,
          },
        })
        .catch((error) => {
          logger.warn(
            'userPropertyHooks',
            'useGatingUserPropertyUsernames',
            'Failed to set usernames for gating',
            error,
          )
        })
    }
  }, [activeAccount?.type, ens, unitag?.username])
}
