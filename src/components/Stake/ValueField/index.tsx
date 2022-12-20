import { ParamType } from 'ethers/lib/utils'
import React from 'react'
import { Input } from 'theme-ui'

import { ParamsForm } from '../ParamsForm'
import { ArrayInput } from './ArrayInput'

interface Props<T extends unknown> {
  param: ParamType
  value: T
  onChange: (nextValue: T) => void
}

export const ValueField = <T extends unknown>({ param, value, onChange }: Props<T>): React.ReactElement => {
  if (param.arrayChildren !== null) {
    const arrayValue =
      (value as readonly unknown[]) ?? Array(param.arrayLength === -1 ? 1 : param.arrayLength).fill(null)
    return (
      <ArrayInput
        arrayLength={param.arrayLength}
        arrayChildren={param.arrayChildren}
        values={arrayValue}
        onChange={onChange as (data: readonly unknown[]) => void}
      />
    )
  }

  if (param.components !== null) {
    const tupleValue = (value as readonly unknown[]) ?? Array(param.components.length).fill(null)
    return (
      <ParamsForm
        params={param.components}
        values={tupleValue}
        onChange={onChange as (data: readonly unknown[]) => void}
      />
    )
  }

  if (param.type === 'address') {
    return (
      <Input
        type="text"
        placeholder="0x000000...."
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value as T)}
      />
    )
  }

  if (param.type === 'string') {
    return (
      <Input
        type="text"
        placeholder="Enter a string"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value as T)}
      />
    )
  }

  if (param.type === 'bytes') {
    return (
      <Input
        type="text"
        placeholder="0x00...."
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value as T)}
      />
    )
  }

  if (param.type.startsWith('uint')) {
    return (
      <Input
        type="number"
        placeholder="123456"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value.toString() as T)}
      />
    )
  }

  return <span>Unknown type {param.type}</span>
}
