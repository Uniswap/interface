import { useWeb3React } from '@web3-react/core'
import { useAppSelector } from 'state/hooks'

import { SignatureDetails } from './types'

export function useAllSignatures(): { [id: string]: SignatureDetails } {
  const { account } = useWeb3React()
  const signatures = useAppSelector((state) => state.signatures) ?? {}
  if (!account || !signatures[account]) return {}
  return signatures[account]
}
