import React from 'react'

import { useSuspendWhen } from '../../hooks/useSuspendWhen'

export const Suspend = (props: { when: boolean; children: React.ReactNode }) => {
  useSuspendWhen(props.when)
  return <>{props.children}</>
}
