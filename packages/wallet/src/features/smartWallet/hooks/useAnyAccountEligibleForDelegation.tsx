import { useEffect, useState } from 'react'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { logger } from 'utilities/src/logger/logger'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { AddressWithBalanceAndName } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { doesAccountNeedDelegationForChain } from 'wallet/src/features/smartWallet/delegation/utils'

export function useAnyAccountEligibleForDelegation(accounts: AddressWithBalanceAndName[] | undefined): {
  eligible: boolean | undefined
  loading: boolean
} {
  const { chains: enabledChains } = useEnabledChains()
  const [eligible, setEligible] = useState<boolean | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    async function checkDelegation(): Promise<void> {
      if (!accounts) {
        return
      }
      const { delegationDetails } = await checkWalletDelegation({
        walletAddresses: accounts.map((account) => account.address),
        chainIds: enabledChains.map((chain) => chain.valueOf()),
      })

      const isEligible = flattenObjectOfObjects(delegationDetails).some((result) =>
        doesAccountNeedDelegationForChain(result),
      )
      setEligible(isEligible)
    }
    setLoading(true)
    checkDelegation()
      .catch((error) => {
        logger.error(error, {
          tags: { file: 'useAnyAccountEligibleForDelegation', function: 'checkDelegation' },
        })
      })
      .finally(() => setLoading(false))
  }, [accounts, enabledChains])

  return { eligible, loading }
}
