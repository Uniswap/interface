import React from 'react'

import { useSuspendif } from '../../hooks/useSuspendif'

export const Suspend = (props: { if: boolean; children: React.ReactNode }) => {
  useSuspendif(props.if)
  return <>{props.children}</>
}
