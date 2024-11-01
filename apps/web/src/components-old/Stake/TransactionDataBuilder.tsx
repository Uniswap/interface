import { FunctionFragment } from '@ethersproject/abi'
import { defaultAbiCoder } from 'ethers/lib/utils'
import React from 'react'

import { ParamsForm } from './ParamsForm'

interface Props {
  method: FunctionFragment
  args?: readonly unknown[]
  onChange: (data: readonly unknown[]) => void
}

export const TransactionDataBuilder: React.FC<Props> = ({ method, args, onChange }: Props) => {
  return (
    <ParamsForm
      params={method.inputs}
      values={args ?? defaultAbiCoder.getDefaultValue(method.inputs)}
      onChange={(newValues) => {
        onChange(newValues)
      }}
    />
  )
}
