import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { useActiveAccount } from 'src/features/wallet/hooks'

export function ProfileIcon({ size }: { size: number }) {
  const activeAddress = useActiveAccount()?.address

  return <Identicon address={activeAddress ?? ''} size={size} />
}
