import React, { ReactNode } from 'react'
import { TYPE } from '../../../../theme'
import { AutoColumn } from '../../../Column'

interface DataDisplayerProps {
  title: string
  data: ReactNode
  dataTextSize?: number
  alignTitleRight?: boolean
}

function DataDisplayer({ title, dataTextSize, data, alignTitleRight }: DataDisplayerProps) {
  return (
    <AutoColumn gap="4px">
      <TYPE.small
        fontWeight="600"
        textAlign={alignTitleRight ? 'right' : 'left'}
        fontSize="11px"
        lineHeight="13px"
        letterSpacing="0.06em"
        color="text5"
      >
        {title}
      </TYPE.small>
      <TYPE.small fontWeight="500" fontSize={dataTextSize ? `${dataTextSize}px` : '14px'}>
        {data}
      </TYPE.small>
    </AutoColumn>
  )
}

export default DataDisplayer
