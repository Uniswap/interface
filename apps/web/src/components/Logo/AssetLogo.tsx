import { Currency } from '@uniswap/sdk-core'
import React from 'react'

export type AssetLogoBaseProps = {
  symbol?: string | null
  primaryImg?: string | null
  size?: number
  style?: React.CSSProperties
  currency?: Currency | null
  loading?: boolean
}
