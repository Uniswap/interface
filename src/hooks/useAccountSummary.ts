import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import ENS from '@ensdomains/ensjs'
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
export default function useAccountSummary(address?: string | null): {
  summary: AccountSummary | null
  nom: string | null
  loading: boolean
} {
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [nom, setNom] = useState<string | null>(null)
  const { kit } = useContractKit()
  const provider = useProvider()

  useEffect(() => {
    ;(async () => {
      if (!address) {
        return
      }
      try {
        const accounts = await kit.contracts.getAccounts()
        const account = await accounts.signerToAccount(address)
        setSummary(await accounts.getAccountSummary(account))
      } catch (e) {
        console.error('Could not fetch account summary', e)
      }

      const nom = new ENS({ provider, ensAddress: '0x3DE51c3960400A0F752d3492652Ae4A0b2A36FB3' })
      try {
        const { name } = await nom.getName(address)
        if (name) setNom(`${name}.nom`)
      } catch (e) {
        console.error('Could not fetch nom data', e)
      }
    })()
  }, [address, kit, provider])

  return { summary, nom, loading: summary === null }
}
