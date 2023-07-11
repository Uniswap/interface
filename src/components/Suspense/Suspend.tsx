import React from 'react'

import { useSuspendIf } from '../../hooks/useSuspendIf'

export const Suspend = (props: { if: boolean; children: React.ReactNode }) => {
  useSuspendIf(props.if)
  return <>{props.children}</>
}
