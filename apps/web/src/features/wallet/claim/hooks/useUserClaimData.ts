import { useEffect, useState } from 'react'
import { useAccount } from '~/connection/hooks/useAccount'
import { fetchClaim, type UserClaimData } from '~/features/wallet/claim/utils/fetchClaim'

// parse distributorContract blob and detect if user has claim data
// null means we know it does not
export function useUserClaimData(account: string | null | undefined): UserClaimData | null {
  const { chainId } = useAccount()

  const [claimInfo, setClaimInfo] = useState<{ [account: string]: UserClaimData | null }>({})

  useEffect(() => {
    if (!account || chainId !== 1) {
      return
    }

    fetchClaim(account)
      .then((accountClaimInfo) =>
        // oxlint-disable-next-line no-shadow
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: accountClaimInfo,
          }
        }),
      )
      .catch(() => {
        // oxlint-disable-next-line no-shadow
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: null,
          }
        })
      })
  }, [account, chainId])

  return account && chainId === 1 ? claimInfo[account] : null
}
