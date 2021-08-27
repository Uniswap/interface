import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { useContractKit } from '@celo-tools/use-contractkit'
import { useEffect, useState } from 'react'

type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer U>
  ? U
  : T extends (...args: any) => infer U
  ? U
  : any

type AccountSummary = AsyncReturnType<AccountsWrapper['getAccountSummary']>

/**
 * Fetches the account summary of a Celo account.
 */
export default function useAccountSummary(address?: string): { summary: AccountSummary | null; loading: boolean } {
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const { kit } = useContractKit()

  useEffect(() => {
    ;(async () => {
      if (!address) {
        return
      }
      const accounts = await kit.contracts.getAccounts()
      try {
        const account = await accounts.signerToAccount(address)
        setSummary(await accounts.getAccountSummary(account))
      } catch (e) {
        console.error('Could not fetch account summary', e)
      }
    })()
  }, [address, kit])

  return { summary, loading: summary === null }
}
