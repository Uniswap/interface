import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { useContractKit } from '@celo-tools/use-contractkit'
import { NomKit } from '@nomspace/nomspace'
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

      const nomKit = new NomKit(kit as any, '0xABf8faBbC071F320F222A526A2e1fBE26429344d')
      try {
        setNom(await nomKit.allNamesForResolution(address).then((n) => (n[0] ? `${n[0]}.nom` : null)))
      } catch (e) {
        console.error('Could not fetch nom data', e)
      }
    })()
  }, [address, kit])

  return { summary, nom, loading: summary === null }
}
