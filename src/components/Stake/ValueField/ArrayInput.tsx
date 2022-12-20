import styled from '@emotion/styled'
import { ParamType } from 'ethers/lib/utils'
import React from 'react'
import { TrashIcon } from 'theme'

import { ValueField } from '.'

interface Props<T extends readonly unknown[]> {
  arrayLength: number
  arrayChildren: ParamType
  values: T
  onChange: (data: T) => void
}

export const ArrayInput = <T extends readonly unknown[]>({
  arrayLength,
  arrayChildren,
  values,
  onChange,
}: Props<T>): React.ReactElement => {
  if (arrayLength === -1) {
    // dynamic length
    return (
      <Wrapper>
        {Array(values.length)
          .fill(null)
          .map((_, i) => (
            <FieldWithDelete key={i}>
              <ValueField
                param={arrayChildren}
                value={values[i]}
                onChange={(newV) => {
                  const copy = [...values]
                  copy[i] = newV
                  onChange(copy as unknown as T)
                }}
              />
              <TrashIcon
                onClick={() => {
                  const copy = [...values]
                  copy.splice(i, 1)
                  onChange(copy as unknown as T)
                }}
              />
            </FieldWithDelete>
          ))}
        <button
          onClick={() => {
            onChange([...values, null] as unknown as T)
          }}
        >
          Add another field
        </button>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {Array(arrayLength)
        .fill(null)
        .map((_, i) => (
          <ValueField
            key={i}
            param={arrayChildren}
            value={values[i]}
            onChange={(newV) => {
              const copy = [...values]
              copy[i] = newV
              onChange(copy as unknown as T)
            }}
          />
        ))}
    </Wrapper>
  )
}

const FieldWithDelete = styled.div`
  display: grid;
  grid-template-columns: 1fr 20px;
  grid-column-gap: 4px;
  align-items: center;
  svg {
    cursor: pointer;
  }
`

const Wrapper = styled.div`
  display: grid;
  grid-row-gap: 4px;
`
