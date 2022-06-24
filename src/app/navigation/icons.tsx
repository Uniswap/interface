import React from 'react'
import { Unicon } from 'src/components/unicons/Unicon'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

export function ProfileIcon({ size }: { size: number }) {
  const activeAddress = useActiveAccountAddressWithThrow()

  return <Unicon address={activeAddress} size={size} />
}
