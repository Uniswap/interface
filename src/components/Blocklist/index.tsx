import React, { ReactNode, useMemo } from 'react'
import { BLOCKED_ADDRESSES } from '../../constants'
import { useActiveWeb3React } from '../../hooks'

export default function Blocklist({ children }: { children: ReactNode }) {
  const { account } = useActiveWeb3React()
  const blocked: boolean = useMemo(() => Boolean(account && BLOCKED_ADDRESSES.indexOf(account) !== -1), [account])
  if (blocked) {
    return <div>Blocked address</div>
  }
  return <>{children}</>
}
