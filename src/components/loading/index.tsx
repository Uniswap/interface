import React from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { BoxLoader } from 'src/components/loading/BoxLoader'
import { HeaderLoader } from 'src/components/loading/HeaderLoader'
import { Shimmer } from 'src/components/loading/Shimmer'
import { TokenLoader } from 'src/components/loading/TokenLoader'
import GraphCurveArea from './graph-curve-area.svg'

type SkeletonType = 'box' | 'graph' | 'header' | 'token' | 'image'

interface LoadingProps {
  type?: SkeletonType
  repeat?: number
}

const useChildFromType = (type: SkeletonType, repeat: number) => {
  const theme = useAppTheme()
  switch (type) {
    case 'header':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <HeaderLoader key={i} />
          ))}
        </Box>
      )
    case 'graph':
      return (
        <Box overflow="hidden">
          <GraphCurveArea color={theme.colors.backgroundAction} />
          <GraphCurveArea fill={theme.colors.backgroundAction} style={StyleSheet.absoluteFill} />
        </Box>
      )
    case 'token':
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <TokenLoader key={i} />
          ))}
        </Box>
      )
    case 'image':
      if (repeat > 1) throw new Error('Loading placeholder for images does not support repeat')
      return <BoxLoader aspectRatio={1} borderRadius="none" />
    case 'box':
    default:
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <BoxLoader key={i} height={50} mb="sm" />
          ))}
        </Box>
      )
  }
}

export function Loading({ type = 'box', repeat = 1 }: LoadingProps) {
  const child = useChildFromType(type, repeat)

  return <Shimmer>{child}</Shimmer>
}
