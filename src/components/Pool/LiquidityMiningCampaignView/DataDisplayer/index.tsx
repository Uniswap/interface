import React, { ReactNode } from 'react'
import { TYPE } from '../../../../theme'
import { Colors } from '../../../../theme/styled'
import { AutoColumn } from '../../../Column'

interface DataDisplayerProps {
  title: ReactNode
  data: ReactNode
  dataTextSize?: number
  fontWeight?: number
  color?: keyof Colors
}

function DataDisplayer({ title, dataTextSize, data, fontWeight, color }: DataDisplayerProps) {
  return (
    <AutoColumn gap="4px">
      <TYPE.small
        fontWeight="600"
        fontSize="11px"
        lineHeight="13px"
        letterSpacing="0.06em"
        color="text5"
      >
        {title}
      </TYPE.small>
      <TYPE.small
        fontWeight={fontWeight ?? '500'}
        fontSize={dataTextSize ? `${dataTextSize}px` : '14px'}
        color={color || 'text3'}
      >
        {data}
      </TYPE.small>
    </AutoColumn>
  )
}

export default DataDisplayer
