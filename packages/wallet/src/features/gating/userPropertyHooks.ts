import { useEffect } from 'react'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useENSName } from 'wallet/src/features/ens/api'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function useGatingUserPropertyUsernames(): void {
  const activeAccount = useActiveAccount()
  const validatedAddress = getValidAddress(activeAccount?.address)
  const { data: ens } = useENSName(validatedAddress ?? undefined)
  const { unitag } = useUnitagByAddress(validatedAddress ?? undefined)

  useEffect(() => {
    if (activeAccount?.type === AccountType.SignerMnemonic) {
      const user = Statsig.getCurrentUser()
      Statsig.updateUser({
        ...user,
        privateAttributes: {
          ...user?.privateAttributes,
          unitag: unitag?.username,
          ens: ens?.split('.')[0],
        },
      }).catch((error) => {
        logger.warn('userPropertyHooks', 'useGatingUserPropertyUsernames', 'Failed to set usernames for gating', error)
      })
    }
  }, [activeAccount, ens, unitag?.username])
}
